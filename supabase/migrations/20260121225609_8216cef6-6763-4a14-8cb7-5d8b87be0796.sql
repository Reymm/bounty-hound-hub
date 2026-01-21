-- Update username to BountyBay
UPDATE public.profiles 
SET username = 'BountyBay' 
WHERE id = '8f050746-36d4-4ac7-99d8-a2419e09cc55';

-- Add official role
INSERT INTO public.user_roles (user_id, role)
VALUES ('8f050746-36d4-4ac7-99d8-a2419e09cc55', 'official');

-- Create helper function to check official status
CREATE OR REPLACE FUNCTION public.is_official_account(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'official'
  )
$$;