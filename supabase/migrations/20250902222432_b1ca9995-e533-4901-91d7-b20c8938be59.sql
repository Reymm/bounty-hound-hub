-- Create escrow transactions table
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES public.bounties(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'requires_payment_method',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own escrow transactions" 
ON public.escrow_transactions 
FOR SELECT 
USING (poster_id = auth.uid());

CREATE POLICY "Users can create their own escrow transactions" 
ON public.escrow_transactions 
FOR INSERT 
WITH CHECK (poster_id = auth.uid());

CREATE POLICY "Edge functions can update escrow transactions" 
ON public.escrow_transactions 
FOR UPDATE 
USING (true);

-- Add escrow_status to bounties table
ALTER TABLE public.bounties 
ADD COLUMN escrow_status TEXT DEFAULT 'pending',
ADD COLUMN escrow_amount DECIMAL(10,2);

-- Create updated_at trigger for escrow_transactions
CREATE TRIGGER update_escrow_transactions_updated_at
BEFORE UPDATE ON public.escrow_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();