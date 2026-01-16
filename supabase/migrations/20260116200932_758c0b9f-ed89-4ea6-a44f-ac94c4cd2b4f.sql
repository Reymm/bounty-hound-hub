-- Delete all failed/test escrow transactions except the successful "car part for mustang" one
DELETE FROM escrow_transactions 
WHERE id != '09ac8456-fcc0-4de1-bbe3-5e5a690ac2b9';