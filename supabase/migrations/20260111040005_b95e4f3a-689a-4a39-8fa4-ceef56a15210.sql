-- Create a function to allow admins to update partner status
CREATE OR REPLACE FUNCTION public.admin_set_partner_status(
  target_user_id UUID,
  p_is_partner BOOLEAN,
  p_partner_name TEXT DEFAULT NULL,
  p_partner_commission_percent DECIMAL(5,4) DEFAULT NULL,
  p_partner_flat_fee_cents INTEGER DEFAULT NULL,
  p_partner_attribution_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update the target user's partner status
  UPDATE public.profiles 
  SET 
    is_partner = p_is_partner,
    partner_name = p_partner_name,
    partner_commission_percent = p_partner_commission_percent,
    partner_flat_fee_cents = p_partner_flat_fee_cents,
    partner_attribution_expires_at = p_partner_attribution_expires_at,
    updated_at = now()
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;