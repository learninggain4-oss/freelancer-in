
-- Drop existing user update policy
DROP POLICY IF EXISTS "Users can update own rejected verification" ON public.bank_verifications;

-- Allow users to update own verification when pending or rejected
CREATE POLICY "Users can update own pending or rejected verification"
ON public.bank_verifications FOR UPDATE
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND status IN ('pending'::bank_verification_status, 'rejected'::bank_verification_status)
);

-- Allow users to delete own verification when pending
CREATE POLICY "Users can delete own pending verification"
ON public.bank_verifications FOR DELETE
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND status = 'pending'::bank_verification_status
);
