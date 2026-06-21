ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mobile_verification_status text NOT NULL DEFAULT 'not_submitted',
ADD COLUMN IF NOT EXISTS mobile_verification_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS mobile_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS mobile_verification_notes text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_mobile_verification_status_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_mobile_verification_status_check
CHECK (mobile_verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));

CREATE INDEX IF NOT EXISTS profiles_mobile_verification_status_idx
ON public.profiles (mobile_verification_status, mobile_verification_requested_at DESC);
