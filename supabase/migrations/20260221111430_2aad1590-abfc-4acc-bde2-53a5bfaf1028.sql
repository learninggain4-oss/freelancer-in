
-- Add new columns for the revamped payment flow
ALTER TABLE public.payment_confirmations
  ADD COLUMN IF NOT EXISTS utr_number text,
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS receipt_name text,
  ADD COLUMN IF NOT EXISTS qr_code_path text,
  ADD COLUMN IF NOT EXISTS qr_code_name text,
  ADD COLUMN IF NOT EXISTS client_payment_info text,
  ADD COLUMN IF NOT EXISTS method_selected_at timestamptz,
  ADD COLUMN IF NOT EXISTS details_shared_at timestamptz;

-- Create payment-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-attachments', 'payment-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for payment-attachments bucket
CREATE POLICY "Authenticated users can upload payment attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Project participants can view payment attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can manage payment attachments"
ON storage.objects FOR ALL
USING (
  bucket_id = 'payment-attachments'
  AND public.has_role(auth.uid(), 'admin')
);

-- Insert new admin settings for countdown timers (defaults: 10min and 7min)
INSERT INTO public.app_settings (key, value)
VALUES
  ('payment_method_countdown_seconds', '600'),
  ('payment_details_countdown_seconds', '420')
ON CONFLICT (key) DO NOTHING;
