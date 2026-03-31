
-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  max_amount NUMERIC NOT NULL DEFAULT 15,
  max_uses INTEGER NOT NULL DEFAULT 20,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active promo codes (to validate them)
CREATE POLICY "Anyone can read active promo codes"
  ON public.promo_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only service_role can insert/update (managed via edge functions)
-- No insert/update/delete policies for authenticated users
