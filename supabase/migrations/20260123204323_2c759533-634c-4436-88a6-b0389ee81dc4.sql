UPDATE escrow_transactions SET 
  capture_status = 'captured',
  captured_at = now(),
  total_charged_amount = 10.70,
  stripe_fee_amount = 0.70,
  platform_fee_amount = 2.50,
  payout_sent_amount = 7.50,
  capture_lock_id = NULL,
  capture_locked_at = NULL,
  updated_at = now()
WHERE bounty_id = '00ea2662-a7d2-4eb9-ab58-79f78d5b84bb';