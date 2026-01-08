-- Clear Stripe Connect data for yerttam user to retry with US country selection
UPDATE profiles 
SET 
  stripe_connect_account_id = NULL,
  stripe_connect_onboarding_complete = NULL,
  stripe_connect_charges_enabled = NULL,
  stripe_connect_payouts_enabled = NULL,
  stripe_connect_details_submitted = NULL
WHERE id = 'b8eb6fdc-8df5-495d-af20-58eecaff6dc7';