
-- Explicitly deny anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Explicitly deny anonymous access to documents
CREATE POLICY "Deny anonymous access to documents"
ON public.documents
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Explicitly deny anonymous access to user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
