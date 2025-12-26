-- FIX 1: Create secure view for Bounties that hides shipping_details from unauthorized users
CREATE OR REPLACE VIEW public.bounties_secure AS
SELECT 
  id,
  title,
  description,
  amount,
  category,
  subcategory,
  tags,
  images,
  location,
  deadline,
  status,
  poster_id,
  created_at,
  updated_at,
  escrow_amount,
  escrow_status,
  has_milestones,
  milestone_data,
  requires_shipping,
  shipping_status,
  hunter_purchases_item,
  target_price_min,
  target_price_max,
  verification_requirements,
  view_count,
  -- Only show shipping_details to poster or accepted hunter
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

-- Grant access to the secure view
GRANT SELECT ON public.bounties_secure TO authenticated;
GRANT SELECT ON public.bounties_secure TO anon;

-- FIX 2: Create secure view for profiles that hides payment info from other users
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  username,
  full_name,
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
  kyc_verified,
  kyc_verified_at,
  is_suspended,
  suspended_until,
  is_support_admin,
  -- Only show payment info to the profile owner
  CASE WHEN id = auth.uid() THEN payout_email ELSE NULL END as payout_email,
  CASE WHEN id = auth.uid() THEN payout_country ELSE NULL END as payout_country,
  CASE WHEN id = auth.uid() THEN stripe_connect_account_id ELSE NULL END as stripe_connect_account_id,
  CASE WHEN id = auth.uid() THEN stripe_connect_onboarding_complete ELSE NULL END as stripe_connect_onboarding_complete,
  CASE WHEN id = auth.uid() THEN stripe_connect_charges_enabled ELSE NULL END as stripe_connect_charges_enabled,
  CASE WHEN id = auth.uid() THEN stripe_connect_payouts_enabled ELSE NULL END as stripe_connect_payouts_enabled,
  CASE WHEN id = auth.uid() THEN stripe_connect_details_submitted ELSE NULL END as stripe_connect_details_submitted
FROM public.profiles;

-- Grant access to the secure view
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.profiles_secure TO anon;

-- Add comment explaining security
COMMENT ON VIEW public.bounties_secure IS 'Secure view that hides shipping_details from unauthorized users. Use this instead of direct table access for public queries.';
COMMENT ON VIEW public.profiles_secure IS 'Secure view that hides payment/payout information from other users. Use this instead of direct table access for public queries.';