-- Allow users to update their own bank verification when status is rejected (for resubmission)
CREATE POLICY "Users can update own rejected verification"
ON public.bank_verifications
FOR UPDATE
USING (
  profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
  AND status = 'rejected'::bank_verification_status
);