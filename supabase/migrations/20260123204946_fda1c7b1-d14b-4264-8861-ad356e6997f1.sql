-- Allow support admins to view ALL escrow transactions for finance dashboard
CREATE POLICY "Support admins can view all escrow transactions"
ON public.escrow_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_support_admin = true
  )
);