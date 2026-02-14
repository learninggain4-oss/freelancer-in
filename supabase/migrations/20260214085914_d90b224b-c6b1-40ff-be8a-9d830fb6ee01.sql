
-- Add attempt_count to bank_verifications
ALTER TABLE public.bank_verifications
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1;

-- Add max bank verification attempts setting (default 9)
INSERT INTO public.app_settings (key, value)
VALUES ('max_bank_verification_attempts', '9')
ON CONFLICT (key) DO NOTHING;
