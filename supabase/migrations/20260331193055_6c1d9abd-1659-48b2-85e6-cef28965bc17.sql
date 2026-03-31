-- 1. Fix bounties_secure: set security_invoker so underlying Bounties RLS applies
ALTER VIEW public.bounties_secure SET (security_invoker = true);

-- 2. Fix user_roles: Remove dangerous self-assignment policies
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

-- Role management should only happen through admin functions
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

CREATE POLICY "Only admins can remove roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_support_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_support_admin = true
  )
);

-- 3. Fix notifications: Restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Fix escrow: Replace JWT claim check with proper Postgres role
DROP POLICY IF EXISTS "Service role can manage escrow" ON public.escrow_transactions;

CREATE POLICY "Service role can manage escrow"
ON public.escrow_transactions
FOR UPDATE
TO service_role
USING (true);