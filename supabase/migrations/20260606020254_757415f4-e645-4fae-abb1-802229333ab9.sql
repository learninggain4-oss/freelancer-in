ALTER TABLE public.employee_payment_apps
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS otp_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS otp_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS user_otp text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_payment_apps;
ALTER TABLE public.employee_payment_apps REPLICA IDENTITY FULL;