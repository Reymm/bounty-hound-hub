-- Create partner_payouts table for tracking affiliate payments
CREATE TABLE public.partner_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 50), -- $50 minimum threshold
  payment_method TEXT NOT NULL DEFAULT 'paypal', -- paypal, bank_transfer, venmo, etc.
  payment_reference TEXT, -- PayPal transaction ID, bank reference, etc.
  payout_email TEXT, -- Email/account used for payout
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'confirmed', 'failed')),
  notes TEXT, -- Admin notes about the payout
  period_start DATE, -- Start of earning period covered
  period_end DATE, -- End of earning period covered
  bounties_count INTEGER DEFAULT 0, -- Number of bounties this payout covers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE, -- When admin marked as processing
  sent_at TIMESTAMP WITH TIME ZONE, -- When payment was sent
  confirmed_at TIMESTAMP WITH TIME ZONE, -- When partner confirmed receipt
  created_by UUID REFERENCES public.profiles(id) -- Admin who created the payout
);

-- Enable RLS
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

-- Partners can view their own payouts
CREATE POLICY "Partners can view their own payouts"
ON public.partner_payouts
FOR SELECT
USING (partner_id = auth.uid());

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
ON public.partner_payouts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_support_admin = true
));

-- Admins can create payouts
CREATE POLICY "Admins can create payouts"
ON public.partner_payouts
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_support_admin = true
));

-- Admins can update payouts
CREATE POLICY "Admins can update payouts"
ON public.partner_payouts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_support_admin = true
));

-- Create index for faster lookups
CREATE INDEX idx_partner_payouts_partner_id ON public.partner_payouts(partner_id);
CREATE INDEX idx_partner_payouts_status ON public.partner_payouts(status);

-- Create a function to calculate pending earnings for a partner
CREATE OR REPLACE FUNCTION public.get_partner_pending_earnings(p_partner_id UUID)
RETURNS TABLE(
  total_earnings NUMERIC,
  pending_earnings NUMERIC,
  paid_earnings NUMERIC,
  bounties_count INTEGER,
  last_payout_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_commission_percent NUMERIC;
  v_flat_fee_cents INTEGER;
  v_referral_code VARCHAR;
BEGIN
  -- Get partner's commission rates and referral code
  SELECT 
    COALESCE(partner_commission_percent, 20),
    COALESCE(partner_flat_fee_cents, 0),
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
    -- Get all users referred by this partner
    SELECT referred_id
    FROM public.referrals
    WHERE referral_code = v_referral_code
      AND status IN ('converted', 'rewarded')
  ),
  completed_bounties AS (
    -- Get completed bounties from referred users (as posters)
    SELECT 
      b.id,
      b.amount,
      -- Platform fee: $2 + 5%
      (2 + (b.amount * 0.05)) as platform_fee
    FROM public."Bounties" b
    WHERE b.poster_id IN (SELECT referred_id FROM referred_users)
      AND b.status = 'fulfilled'
  ),
  partner_earnings AS (
    SELECT 
      SUM(
        (platform_fee * v_commission_percent / 100) + (v_flat_fee_cents / 100.0)
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
$$;