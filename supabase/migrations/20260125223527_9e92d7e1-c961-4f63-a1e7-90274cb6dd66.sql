-- Allow anyone to view ratings for public profiles
-- This enables the RatingSummary component to show reviews to visitors
CREATE POLICY "Anyone can view ratings on public profiles"
ON public.user_ratings FOR SELECT
USING (true);