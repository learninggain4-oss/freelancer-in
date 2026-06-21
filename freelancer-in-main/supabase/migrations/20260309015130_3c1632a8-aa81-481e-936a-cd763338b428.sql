
-- Add logo_path column to payment_methods
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS logo_path text;

-- Create storage bucket for payment method logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-method-logos', 'payment-method-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload payment method logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-method-logos'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated admins to update
CREATE POLICY "Admins can update payment method logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'payment-method-logos'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete payment method logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'payment-method-logos'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Public can view logos
CREATE POLICY "Anyone can view payment method logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payment-method-logos');

-- Add UPI banner setting (if not exists)
INSERT INTO public.app_settings (key, value)
VALUES ('upi_banner_path', '')
ON CONFLICT (key) DO NOTHING;
