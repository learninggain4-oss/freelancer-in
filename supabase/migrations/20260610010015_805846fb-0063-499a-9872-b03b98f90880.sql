
-- Per-account bank verification: link bank_verifications to user_bank_accounts
ALTER TABLE public.bank_verifications
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.user_bank_accounts(id) ON DELETE CASCADE;

-- Drop the old profile-wide uniqueness so a user can verify multiple accounts
ALTER TABLE public.bank_verifications
  DROP CONSTRAINT IF EXISTS bank_verifications_profile_id_key;

-- One verification row per (profile, bank account)
CREATE UNIQUE INDEX IF NOT EXISTS bank_verifications_profile_account_uniq
  ON public.bank_verifications (profile_id, bank_account_id)
  WHERE bank_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_verifications_bank_account_id_idx
  ON public.bank_verifications (bank_account_id);
