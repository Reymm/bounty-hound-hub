-- Add shipping details functionality for fulfilled bounties
-- Create enum for shipping status first
CREATE TYPE shipping_status_type AS ENUM ('not_requested', 'requested', 'provided', 'not_provided');

-- Add shipping details and status columns
ALTER TABLE public."Bounties" 
ADD COLUMN shipping_details JSONB,
ADD COLUMN shipping_status shipping_status_type DEFAULT 'not_requested';