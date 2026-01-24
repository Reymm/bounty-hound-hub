-- =====================================================
-- SECURITY FIX: Protect sensitive data in profiles and bounties
-- =====================================================

-- =====================================================
-- PART 1: Fix profiles table - restrict column access
-- =====================================================

-- Drop existing permissive SELECT policies for other users
DROP POLICY IF EXISTS "Authenticated users can view basic public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public basic profile view authenticated" ON public.profiles;

-- The "Own profile complete access" policy already exists, so we just need to ensure
-- there's NO direct access to other profiles from the raw table

-- Create a new limited policy for viewing other profiles that only applies to admins
-- (Using the existing is_support_admin function)
CREATE POLICY "Support admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  is_support_admin(auth.uid())
);

-- =====================================================
-- PART 2: Update bounties_secure view to mask shipping_details
-- =====================================================

-- Drop existing bounties_secure view if it exists
DROP VIEW IF EXISTS public.bounties_secure;

-- Create secure view that masks shipping_details for public access
CREATE VIEW public.bounties_secure
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  amount,
  category,
  subcategory,
  status,
  deadline,
  location,
  poster_id,
  tags,
  images,
  verification_requirements,
  escrow_amount,
  escrow_status,
  requires_shipping,
  shipping_status,
  hunter_purchases_item,
  has_milestones,
  milestone_data,
  target_price_min,
  target_price_max,
  view_count,
  created_at,
  updated_at,
  -- Only show shipping details to the poster or accepted hunter
  CASE 
    WHEN poster_id = auth.uid() THEN shipping_details
    WHEN EXISTS (
      SELECT 1 FROM public."Submissions" s 
      WHERE s.bounty_id = "Bounties".id 
        AND s.hunter_id = auth.uid() 
        AND s.status = 'accepted'
    ) THEN shipping_details
    ELSE NULL 
  END as shipping_details
FROM public."Bounties";

-- Grant appropriate permissions on the view
GRANT SELECT ON public.bounties_secure TO authenticated;
GRANT SELECT ON public.bounties_secure TO anon;

-- =====================================================
-- PART 3: Update profiles_secure view to ensure full_name is masked for non-owners
-- =====================================================

-- Drop and recreate profiles_secure with additional masking
DROP VIEW IF EXISTS public.profiles_secure;

CREATE VIEW public.profiles_secure
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  region,
  reputation_score,
  total_successful_claims,
  total_failed_claims,
  average_rating,
  total_ratings_received,
  total_ratings_given,
  created_at,
  updated_at,
  -- Public fields that are safe to show
  kyc_verified,
  is_suspended,
  -- Sensitive fields - only show to profile owner
  CASE WHEN id = auth.uid() THEN full_name ELSE NULL END as full_name,
  CASE WHEN id = auth.uid() THEN kyc_verified_at ELSE NULL END as kyc_verified_at,
  CASE WHEN id = auth.uid() THEN suspended_until ELSE NULL END as suspended_until,
  CASE WHEN id = auth.uid() THEN is_support_admin ELSE NULL END as is_support_admin,
  CASE WHEN id = auth.uid() THEN payout_email ELSE NULL END as payout_email,
  CASE WHEN id = auth.uid() THEN payout_country ELSE NULL END as payout_country,
  CASE WHEN id = auth.uid() THEN stripe_connect_account_id ELSE NULL END as stripe_connect_account_id,
  CASE WHEN id = auth.uid() THEN stripe_connect_onboarding_complete ELSE NULL END as stripe_connect_onboarding_complete,
  CASE WHEN id = auth.uid() THEN stripe_connect_charges_enabled ELSE NULL END as stripe_connect_charges_enabled,
  CASE WHEN id = auth.uid() THEN stripe_connect_payouts_enabled ELSE NULL END as stripe_connect_payouts_enabled,
  CASE WHEN id = auth.uid() THEN stripe_connect_details_submitted ELSE NULL END as stripe_connect_details_submitted,
  CASE WHEN id = auth.uid() THEN identity_session_id ELSE NULL END as identity_session_id,
  CASE WHEN id = auth.uid() THEN identity_verified ELSE NULL END as identity_verified,
  CASE WHEN id = auth.uid() THEN is_partner ELSE NULL END as is_partner,
  CASE WHEN id = auth.uid() THEN partner_name ELSE NULL END as partner_name,
  CASE WHEN id = auth.uid() THEN partner_attribution_expires_at ELSE NULL END as partner_attribution_expires_at,
  CASE WHEN id = auth.uid() THEN partner_commission_percent ELSE NULL END as partner_commission_percent,
  CASE WHEN id = auth.uid() THEN partner_flat_fee_cents ELSE NULL END as partner_flat_fee_cents,
  CASE WHEN id = auth.uid() THEN referral_code ELSE NULL END as referral_code,
  CASE WHEN id = auth.uid() THEN referred_by ELSE NULL END as referred_by,
  CASE WHEN id = auth.uid() THEN referral_credits ELSE NULL END as referral_credits
FROM public.profiles;

-- Grant appropriate permissions
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.profiles_secure TO anon;