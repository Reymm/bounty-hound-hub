-- ============================================================
-- PREFLIGHT: Check for and clean up any duplicate data before constraints
-- ============================================================

-- Check for duplicate accepted submissions per bounty
DO $$
DECLARE
  dup_count INTEGER;
  dup_record RECORD;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT bounty_id, COUNT(*) as cnt
    FROM public."Submissions"
    WHERE status = 'accepted'
    GROUP BY bounty_id
    HAVING COUNT(*) > 1
  ) dups;
  
  IF dup_count > 0 THEN
    RAISE NOTICE 'Found % bounties with multiple accepted submissions. Keeping only the earliest accepted one.', dup_count;
    
    -- Keep only the earliest accepted submission per bounty, reject others
    FOR dup_record IN 
      SELECT s.id, s.bounty_id
      FROM public."Submissions" s
      WHERE s.status = 'accepted'
        AND s.id NOT IN (
          SELECT DISTINCT ON (bounty_id) id
          FROM public."Submissions"
          WHERE status = 'accepted'
          ORDER BY bounty_id, COALESCE(accepted_at, created_at) ASC
        )
    LOOP
      UPDATE public."Submissions"
      SET status = 'rejected', rejection_reason = 'Auto-rejected: duplicate acceptance cleanup'
      WHERE id = dup_record.id;
      RAISE NOTICE 'Rejected duplicate submission % for bounty %', dup_record.id, dup_record.bounty_id;
    END LOOP;
  END IF;
END $$;

-- Check for duplicate escrows per bounty
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT bounty_id, COUNT(*) as cnt
    FROM public.escrow_transactions
    WHERE bounty_id IS NOT NULL
    GROUP BY bounty_id
    HAVING COUNT(*) > 1
  ) dups;
  
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Found % bounties with multiple escrow transactions. Manual cleanup required before migration.', dup_count;
  END IF;
END $$;

-- Preflight: Normalize any legacy capture_status values before adding constraint
UPDATE public.escrow_transactions
SET capture_status = 'not_captured'
WHERE capture_status IS NULL 
   OR capture_status NOT IN ('not_captured', 'capturing', 'captured', 'capture_failed', 'voided', 'refunded');

-- ============================================================
-- 1. LOCK TIMEOUT: Add capture_locked_at for stale lock detection
-- ============================================================
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS capture_locked_at TIMESTAMPTZ;

-- ============================================================
-- 2. PARTIAL UNIQUE INDEX: Only one accepted submission per bounty
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_accepted_per_bounty 
ON public."Submissions" (bounty_id) 
WHERE status = 'accepted';

-- ============================================================
-- 3. UNIQUE ESCROW PER BOUNTY
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'escrow_transactions_bounty_id_unique'
  ) THEN
    ALTER TABLE public.escrow_transactions 
    ADD CONSTRAINT escrow_transactions_bounty_id_unique UNIQUE (bounty_id);
  END IF;
END $$;

-- ============================================================
-- 4. ELIGIBLE_AT: Store and enforce 7-day hold at DB level
-- ============================================================
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS eligible_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_hold_overridden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payout_hold_overridden_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_hold_overridden_by UUID;

-- Trigger to set eligible_at when submission is accepted
-- Uses accepted_at + 7 days, NOT now()
-- Guards against null accepted_at
CREATE OR REPLACE FUNCTION public.set_escrow_eligible_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When submission status changes to 'accepted', set eligible_at on escrow
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Guard: accepted_at must be set
    IF NEW.accepted_at IS NULL THEN
      RAISE EXCEPTION 'Cannot accept submission: accepted_at is null. This should have been set by set_accepted_at trigger.';
    END IF;
    
    UPDATE public.escrow_transactions
    SET eligible_at = NEW.accepted_at + interval '7 days'
    WHERE bounty_id = NEW.bounty_id
      AND eligible_at IS NULL; -- Only set once
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_escrow_eligible_at_trigger ON public."Submissions";
CREATE TRIGGER set_escrow_eligible_at_trigger
  AFTER UPDATE OF status ON public."Submissions"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_escrow_eligible_at();

-- Trigger to BLOCK manual_payout_status='sent' before eligible_at
-- Also blocks if not captured or if frozen
CREATE OR REPLACE FUNCTION public.enforce_payout_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only check when transitioning TO 'sent'
  IF NEW.manual_payout_status = 'sent' AND (OLD.manual_payout_status IS NULL OR OLD.manual_payout_status != 'sent') THEN
    
    -- Block if capture_status is not 'captured'
    IF NEW.capture_status != 'captured' THEN
      RAISE EXCEPTION 'Cannot mark payout as sent: payment has not been captured. capture_status: %', NEW.capture_status;
    END IF;
    
    -- Block if payout is frozen
    IF NEW.payout_freeze = true THEN
      RAISE EXCEPTION 'Cannot mark payout as sent: payout is frozen. Reason: %', COALESCE(NEW.payout_freeze_reason, 'No reason provided');
    END IF;
    
    -- Block if 7-day hold not elapsed (unless admin override)
    IF NEW.payout_hold_overridden = false 
       AND (NEW.eligible_at IS NULL OR now() < NEW.eligible_at) THEN
      RAISE EXCEPTION 'Cannot mark payout as sent: 7-day hold period has not elapsed. eligible_at: %, now: %', NEW.eligible_at, now();
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_payout_eligibility_trigger ON public.escrow_transactions;
CREATE TRIGGER enforce_payout_eligibility_trigger
  BEFORE UPDATE OF manual_payout_status ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payout_eligibility();

-- ============================================================
-- 5. AUDIT FIELDS: Track who sent payout and exact amount
-- ============================================================
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS payout_sent_by_admin_user_id UUID,
ADD COLUMN IF NOT EXISTS payout_sent_amount NUMERIC;

-- Partial unique index on manual_payout_reference when status is 'sent'
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_payout_reference_when_sent
ON public.escrow_transactions (manual_payout_reference)
WHERE manual_payout_status = 'sent' AND manual_payout_reference IS NOT NULL;

-- ============================================================
-- 6. REFUND FIELDS: Data model only, no logic yet
-- ============================================================
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_reference TEXT,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC;

-- Update capture_status check constraint to include new states
ALTER TABLE public.escrow_transactions 
DROP CONSTRAINT IF EXISTS escrow_transactions_capture_status_check;

ALTER TABLE public.escrow_transactions 
ADD CONSTRAINT escrow_transactions_capture_status_check 
CHECK (capture_status IN ('not_captured', 'capturing', 'captured', 'capture_failed', 'voided', 'refunded'));

-- ============================================================
-- 7. RPC FUNCTION: Atomic capture lock with stale reclaim
-- Cleaner than .or() filter, no syntax ambiguity
-- ============================================================
CREATE OR REPLACE FUNCTION public.acquire_capture_lock(
  p_escrow_id UUID,
  p_lock_id UUID,
  p_lock_timeout_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  success BOOLEAN,
  escrow_id UUID,
  lock_id UUID,
  payment_intent_id TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_escrow RECORD;
  v_stale_threshold TIMESTAMPTZ;
BEGIN
  v_stale_threshold := now() - (p_lock_timeout_minutes || ' minutes')::INTERVAL;
  
  -- Try to acquire lock atomically
  UPDATE public.escrow_transactions e
  SET 
    capture_status = 'capturing',
    capture_lock_id = p_lock_id,
    capture_locked_at = now(),
    updated_at = now()
  WHERE e.id = p_escrow_id
    AND (
      -- Normal acquisition: not captured yet or previous failure
      e.capture_status IN ('not_captured', 'capture_failed')
      -- OR stale lock reclaim: capturing but lock is old
      OR (e.capture_status = 'capturing' AND e.capture_locked_at < v_stale_threshold)
    )
  RETURNING e.id, e.capture_lock_id, e.stripe_payment_intent_id
  INTO v_escrow;
  
  IF v_escrow IS NULL THEN
    -- Could not acquire lock
    RETURN QUERY SELECT 
      false::BOOLEAN,
      p_escrow_id,
      NULL::UUID,
      NULL::TEXT,
      'Could not acquire lock. Another process may have it or payment already captured.'::TEXT;
    RETURN;
  END IF;
  
  -- Verify we own the lock (race condition check)
  IF v_escrow.capture_lock_id != p_lock_id THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      p_escrow_id,
      NULL::UUID,
      NULL::TEXT,
      'Lock was acquired by another process.'::TEXT;
    RETURN;
  END IF;
  
  -- Success
  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_escrow.id,
    v_escrow.capture_lock_id,
    v_escrow.stripe_payment_intent_id,
    'Lock acquired successfully.'::TEXT;
END;
$$;