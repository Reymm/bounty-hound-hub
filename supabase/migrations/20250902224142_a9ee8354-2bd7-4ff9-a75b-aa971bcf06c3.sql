-- Add missing essential columns to Bounties table
ALTER TABLE public."Bounties" 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS verification_requirements TEXT[],
ADD COLUMN IF NOT EXISTS target_price_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS target_price_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add foreign key constraints for data integrity
ALTER TABLE public."Submissions" 
ADD CONSTRAINT fk_submissions_bounty 
FOREIGN KEY (bounty_id) REFERENCES public."Bounties"(id) ON DELETE CASCADE;

-- Fix profiles table to properly link to auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_user 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;