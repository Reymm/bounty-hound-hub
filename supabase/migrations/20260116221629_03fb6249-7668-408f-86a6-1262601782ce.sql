-- Reset the escrow capture status to allow retry
UPDATE escrow_transactions 
SET 
  capture_status = 'not_captured',
  capture_error = NULL,
  capture_lock_id = NULL,
  capture_locked_at = NULL,
  captured_at = NULL
WHERE bounty_id = '5cc0c313-b6ca-4c80-a53e-2582395d08f2';