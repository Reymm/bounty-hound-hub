-- Fix get_partner_pending_earnings function
-- 1. Track HUNTERS (not posters) via submissions table
-- 2. Calculate earnings as: $0.50 flat + 20% of the 5% variable portion
DROP FUNCTION IF EXISTS public.get_partner_pending_earnings(uuid);

CREATE OR REPLACE FUNCTION public.get_partner_pending_earnings(p_partner_id uuid)
 RETURNS TABLE(total_earnings numeric, pending_earnings numeric, paid_earnings numeric, bounties_count integer, last_payout_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_commission_percent NUMERIC;
  v_flat_fee_cents INTEGER;
  v_referral_code VARCHAR;
BEGIN
  -- Get partner's commission rates and referral code
  -- Default: 20% commission on 5% portion, 50 cents flat fee
  SELECT 
    COALESCE(partner_commission_percent, 20),
    COALESCE(partner_flat_fee_cents, 50),  -- Changed default from 0 to 50 cents
    referral_code
  INTO v_commission_percent, v_flat_fee_cents, v_referral_code
  FROM public.profiles
  WHERE id = p_partner_id AND is_partner = true;
  
  IF v_referral_code IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::INTEGER, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  RETURN QUERY
  WITH referred_users AS (
    -- Get all users referred by this partner (converted status)
    SELECT referred_id
    FROM public.referrals
    WHERE referral_code = v_referral_code
      AND status IN ('converted', 'rewarded')
  ),
  completed_bounties AS (
    -- Get completed bounties where referred users are HUNTERS (not posters)
    SELECT 
      b.id,
      b.amount
    FROM public."Bounties" b
    INNER JOIN public."Submissions" s ON s.bounty_id = b.id
    WHERE s.hunter_id IN (SELECT referred_id FROM referred_users)
      AND s.status = 'accepted'
      AND b.status = 'fulfilled'
  ),
  partner_earnings AS (
    SELECT 
      SUM(
        -- Partner gets: flat fee + 20% of the 5% variable portion ONLY (not the $2 flat)
        -- Formula: $0.50 + 20% of (bounty * 5%)
        ((amount * 0.05) * v_commission_percent / 100) + (v_flat_fee_cents / 100.0)
      ) as total_earned,
      COUNT(*) as total_bounties
    FROM completed_bounties
  ),
  paid_out AS (
    SELECT COALESCE(SUM(amount), 0) as paid, MAX(sent_at) as last_payout
    FROM public.partner_payouts
    WHERE partner_id = p_partner_id AND status IN ('sent', 'confirmed')
  )
  SELECT 
    COALESCE(pe.total_earned, 0)::NUMERIC as total_earnings,
    GREATEST(0, COALESCE(pe.total_earned, 0) - po.paid)::NUMERIC as pending_earnings,
    po.paid::NUMERIC as paid_earnings,
    COALESCE(pe.total_bounties, 0)::INTEGER as bounties_count,
    po.last_payout
  FROM partner_earnings pe, paid_out po;
END;
$function$;