DROP POLICY IF EXISTS "Users can insert own bank accounts" ON public.user_bank_accounts;
DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.user_bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.user_bank_accounts;

CREATE POLICY "Users can insert own bank accounts"
ON public.user_bank_accounts FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can view own bank accounts"
ON public.user_bank_accounts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));