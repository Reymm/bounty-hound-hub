-- Add cancellation tracking to escrow_transactions
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS cancellation_fee_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS refund_amount numeric;

-- Add comment explaining the fee structure
COMMENT ON COLUMN public.escrow_transactions.cancellation_fee_amount IS 'Fee charged for cancellations after 24 hours (2% of bounty amount)';

-- Create function to calculate cancellation fee
CREATE OR REPLACE FUNCTION public.calculate_cancellation_fee(
  bounty_id_param uuid,
  cancellation_time timestamp with time zone DEFAULT now()
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  bounty_created_at timestamp with time zone;
  bounty_amount numeric;
  hours_since_creation numeric;
  cancellation_fee numeric;
BEGIN
  -- Get bounty creation time and amount
  SELECT b.created_at, b.amount
  INTO bounty_created_at, bounty_amount
  FROM public."Bounties" b
  WHERE b.id = bounty_id_param;
  
  IF bounty_created_at IS NULL THEN
    RAISE EXCEPTION 'Bounty not found';
  END IF;
  
  -- Calculate hours since creation
  hours_since_creation := EXTRACT(EPOCH FROM (cancellation_time - bounty_created_at)) / 3600;
  
  -- Apply 2% fee if more than 24 hours
  IF hours_since_creation > 24 THEN
    cancellation_fee := ROUND(bounty_amount * 0.02, 2);
  ELSE
    cancellation_fee := 0;
  END IF;
  
  RETURN cancellation_fee;
END;
$$;