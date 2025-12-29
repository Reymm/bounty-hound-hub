-- Add accepted_at to Submissions for proper 7-day hold calculation
ALTER TABLE public."Submissions" 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Add idempotency and freeze columns to escrow_transactions
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS capture_status TEXT DEFAULT 'not_captured' 
  CHECK (capture_status IN ('not_captured', 'capturing', 'captured', 'capture_failed')),
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS capture_lock_id UUID,
ADD COLUMN IF NOT EXISTS capture_error TEXT,
ADD COLUMN IF NOT EXISTS payout_freeze BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payout_freeze_reason TEXT;

-- Create trigger function to sync dispute_opened to payout_freeze
CREATE OR REPLACE FUNCTION public.sync_dispute_to_payout_freeze()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When dispute_opened becomes true, freeze the payout
  IF NEW.dispute_opened = true AND (OLD.dispute_opened IS NULL OR OLD.dispute_opened = false) THEN
    UPDATE public.escrow_transactions
    SET 
      payout_freeze = true,
      payout_freeze_reason = COALESCE(NEW.dispute_reason, 'Dispute opened by hunter'),
      updated_at = now()
    WHERE bounty_id = NEW.bounty_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on Submissions
DROP TRIGGER IF EXISTS sync_dispute_freeze_trigger ON public."Submissions";
CREATE TRIGGER sync_dispute_freeze_trigger
  AFTER UPDATE OF dispute_opened ON public."Submissions"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_dispute_to_payout_freeze();

-- Also set accepted_at when status changes to 'accepted' 
CREATE OR REPLACE FUNCTION public.set_accepted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only set accepted_at once, when status first becomes 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') AND NEW.accepted_at IS NULL THEN
    NEW.accepted_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on Submissions for accepted_at
DROP TRIGGER IF EXISTS set_accepted_at_trigger ON public."Submissions";
CREATE TRIGGER set_accepted_at_trigger
  BEFORE UPDATE OF status ON public."Submissions"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_accepted_at();

-- Create index for faster admin payout queries
CREATE INDEX IF NOT EXISTS idx_escrow_manual_payout_status 
ON public.escrow_transactions (manual_payout_status, capture_status, payout_freeze);