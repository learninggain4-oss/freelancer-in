
-- Drop broken restrictive policies
DROP POLICY "Deny anon access to user_reviews" ON public.user_reviews;
DROP POLICY "Users can insert own reviews" ON public.user_reviews;
DROP POLICY "Users can view own reviews" ON public.user_reviews;
DROP POLICY "Admins can manage reviews" ON public.user_reviews;

-- Recreate with correct permissive/restrictive pattern
-- Deny anon as restrictive on anon role only
CREATE POLICY "Deny anon access to user_reviews" ON public.user_reviews AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Permissive policies for authenticated users
CREATE POLICY "Users can insert own reviews" ON public.user_reviews FOR INSERT TO authenticated
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own reviews" ON public.user_reviews FOR SELECT TO authenticated
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage reviews" ON public.user_reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
