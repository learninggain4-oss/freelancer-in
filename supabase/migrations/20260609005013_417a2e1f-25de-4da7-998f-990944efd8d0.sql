DROP POLICY IF EXISTS "Deny anon access" ON public.user_bank_accounts;

CREATE POLICY "Deny anon access"
ON public.user_bank_accounts
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);