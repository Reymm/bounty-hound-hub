-- Reset stale capture lock so we can test the fix
UPDATE escrow_transactions 
SET capture_status = 'not_captured',
    capture_lock_id = NULL,
    capture_locked_at = NULL,
    updated_at = now()
WHERE id = '7e0d7157-7f1d-4a2d-8d21-386d32200b5c'