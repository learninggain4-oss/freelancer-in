
-- Add verify window change cooldown timestamp
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verify_window_changed_at timestamptz;

-- Grants for mobile_verifications
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_verifications TO authenticated;
GRANT ALL ON public.mobile_verifications TO service_role;

-- Grants for mobile_verify_time_slots
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_verify_time_slots TO authenticated;
GRANT ALL ON public.mobile_verify_time_slots TO service_role;

-- Policies: mobile_verifications
DROP POLICY IF EXISTS "Users read own mobile verifications" ON public.mobile_verifications;
CREATE POLICY "Users read own mobile verifications"
ON public.mobile_verifications FOR SELECT TO authenticated
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins manage mobile verifications" ON public.mobile_verifications;
CREATE POLICY "Admins manage mobile verifications"
ON public.mobile_verifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own mobile verifications" ON public.mobile_verifications;
CREATE POLICY "Users insert own mobile verifications"
ON public.mobile_verifications FOR INSERT TO authenticated
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own mobile verifications" ON public.mobile_verifications;
CREATE POLICY "Users update own mobile verifications"
ON public.mobile_verifications FOR UPDATE TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Policies: mobile_verify_time_slots
DROP POLICY IF EXISTS "Users read own verify slots" ON public.mobile_verify_time_slots;
CREATE POLICY "Users read own verify slots"
ON public.mobile_verify_time_slots FOR SELECT TO authenticated
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins manage verify slots" ON public.mobile_verify_time_slots;
CREATE POLICY "Admins manage verify slots"
ON public.mobile_verify_time_slots FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
