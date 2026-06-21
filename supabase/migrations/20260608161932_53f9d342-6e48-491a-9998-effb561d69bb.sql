ALTER TABLE public.employee_payment_apps 
ADD COLUMN IF NOT EXISTS otp_submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS kyc_enabled_at timestamptz;