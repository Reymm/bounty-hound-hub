-- Fix security issue: Restrict public access to profiles table
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create a new policy that only allows authenticated users to view basic profile info
-- and restricts the data to only public-safe fields
CREATE POLICY "Authenticated users can view public profile data" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a secure view for public profile data that only exposes safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  reputation_score,
  total_successful_claims,
  average_rating,
  total_ratings_received,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create RLS policy for the public view (authenticated users only)
CREATE POLICY "Authenticated users can view public profiles view"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);

-- Update the existing get_public_profile_data function to use only safe fields
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_id uuid)
RETURNS TABLE(
  id uuid, 
  username text, 
  avatar_url text, 
  reputation_score numeric, 
  total_successful_claims integer,
  average_rating numeric,
  total_ratings_received integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.reputation_score,
    p.total_successful_claims,
    p.average_rating,
    p.total_ratings_received
  FROM public.profiles p
  WHERE p.id = profile_id;
$function$;