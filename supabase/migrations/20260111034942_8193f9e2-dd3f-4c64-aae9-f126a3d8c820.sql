-- Add attribution expiry field for partners
ALTER TABLE public.profiles
ADD COLUMN partner_attribution_expires_at TIMESTAMPTZ DEFAULT NULL;

-- NULL = lifetime attribution (founding partners)
-- Set a date = attribution expires after that date
COMMENT ON COLUMN public.profiles.partner_attribution_expires_at IS 'When partner attribution expires. NULL means lifetime (founding partners).';