
-- Add amount column to payment_confirmations
ALTER TABLE public.payment_confirmations
  ADD COLUMN amount numeric NOT NULL DEFAULT 0;

-- Insert admin settings for payment re-initiation
INSERT INTO public.app_settings (key, value)
VALUES
  ('payment_max_retries', '3'),
  ('payment_reinitiation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
