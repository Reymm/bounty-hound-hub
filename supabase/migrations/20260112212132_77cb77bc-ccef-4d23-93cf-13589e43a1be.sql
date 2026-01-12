-- Clean up corrupted escrow records with empty payment intent IDs
DELETE FROM public.escrow_transactions 
WHERE stripe_payment_intent_id = '' 
   OR stripe_payment_intent_id IS NULL;