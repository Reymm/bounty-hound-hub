UPDATE escrow_transactions SET 
  capture_status = 'captured',
  captured_at = now(),
  total_charged_amount = 10.70,
  payout_sent_amount = 7.50,
  capture_lock_id = NULL,
  capture_locked_at = NULL,
  updated_at = now()
WHERE bounty_id = '00ea2662-0281-4f64-80bf-d3d968d50a47';