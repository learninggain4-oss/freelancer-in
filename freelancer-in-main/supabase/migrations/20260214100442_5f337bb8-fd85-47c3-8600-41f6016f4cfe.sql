
-- Add under_process to aadhaar_verification_status enum
ALTER TYPE public.aadhaar_verification_status ADD VALUE IF NOT EXISTS 'under_process' AFTER 'pending';

-- Drop existing user update policy and recreate to include 'pending'
DROP POLICY IF EXISTS "Users can update own pending verification" ON public.aadhaar_verifications;

CREATE POLICY "Users can update own pending or rejected verification"
ON public.aadhaar_verifications FOR UPDATE
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND status IN ('not_submitted'::aadhaar_verification_status, 'pending'::aadhaar_verification_status, 'rejected'::aadhaar_verification_status)
);

-- Add DELETE policy for users when pending
CREATE POLICY "Users can delete own pending verification"
ON public.aadhaar_verifications FOR DELETE
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND status = 'pending'::aadhaar_verification_status
);
