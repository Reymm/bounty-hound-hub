-- Add missing DELETE policy for partner_applications
CREATE POLICY "Admins can delete partner applications" 
ON public.partner_applications 
FOR DELETE 
USING (is_support_admin(auth.uid()));