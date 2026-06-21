DROP POLICY IF EXISTS "Admins can manage bank accounts" ON public.user_bank_accounts;
DROP POLICY IF EXISTS "Admins can update bank accounts" ON public.user_bank_accounts;
DROP POLICY IF EXISTS "Admins manage bank accounts" ON public.user_bank_accounts;

CREATE POLICY "Admins full access bank accounts" ON public.user_bank_accounts
AS PERMISSIVE FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));