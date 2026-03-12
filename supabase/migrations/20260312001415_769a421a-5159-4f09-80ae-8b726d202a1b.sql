
ALTER TABLE public.wallet_types
  ADD COLUMN IF NOT EXISTS wallet_price text DEFAULT 'Free',
  ADD COLUMN IF NOT EXISTS monthly_withdrawal_limit text DEFAULT '1',
  ADD COLUMN IF NOT EXISTS monthly_transaction_limit text DEFAULT '10',
  ADD COLUMN IF NOT EXISTS minimum_withdrawal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_expiry text DEFAULT 'Unlimited';

-- Rename existing columns for clarity
ALTER TABLE public.wallet_types RENAME COLUMN min_balance TO monthly_min_balance;
ALTER TABLE public.wallet_types RENAME COLUMN max_balance TO wallet_max_capacity;
ALTER TABLE public.wallet_types RENAME COLUMN daily_withdrawal_limit TO daily_withdrawal_limit_old;

-- Remove old column not needed
ALTER TABLE public.wallet_types DROP COLUMN IF EXISTS daily_withdrawal_limit_old;
