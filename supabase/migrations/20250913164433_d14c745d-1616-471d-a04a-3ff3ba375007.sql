-- Add shipping details functionality for fulfilled bounties
ALTER TABLE public."Bounties" 
ADD COLUMN shipping_details JSONB,
ADD COLUMN shipping_status TEXT DEFAULT 'not_requested';

-- Create enum for shipping status
CREATE TYPE shipping_status_type AS ENUM ('not_requested', 'requested', 'provided', 'not_provided');

-- Update column to use the enum
ALTER TABLE public."Bounties" 
ALTER COLUMN shipping_status TYPE shipping_status_type USING shipping_status::shipping_status_type;