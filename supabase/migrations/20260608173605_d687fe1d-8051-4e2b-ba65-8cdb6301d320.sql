ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_window_start time,
  ADD COLUMN IF NOT EXISTS kyc_window_end time;