-- Reset escrow for fresh test
UPDATE escrow_transactions 
SET 
  capture_status = 'not_captured',
  capture_error = NULL,
  capture_lock_id = NULL,
  capture_locked_at = NULL,
  captured_at = NULL,
  payout_method = NULL,
  manual_payout_status = NULL,
  payout_sent_amount = NULL,
  platform_fee_amount = NULL,
  total_charged_amount = NULL,
  charge_attempted_at = NULL
WHERE bounty_id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2';

UPDATE "Submissions" 
SET status = 'accepted'
WHERE bounty_id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2';