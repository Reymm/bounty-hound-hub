-- Fix security issue: Restrict public access to profiles table
-- Drop the overly permissive public policy that allowed unauthenticated access
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create a new policy that requires authentication to view profiles
-- This prevents unauthenticated users from accessing any profile data
CREATE POLICY "Authenticated users can view public profile data" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Update the existing get_public_profile_data function to ensure it only returns safe fields
-- This function can be used for public profile displays
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