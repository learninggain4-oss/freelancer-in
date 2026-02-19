
-- Create payment_methods table for admin-managed payment options
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active payment methods
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods FOR SELECT
USING (true);

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "Deny anon access to payment_methods"
ON public.payment_methods FOR ALL
USING (false)
WITH CHECK (false);

-- Trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default payment methods
INSERT INTO public.payment_methods (id, name, is_active, display_order) VALUES
  (gen_random_uuid(), 'GPay', true, 1),
  (gen_random_uuid(), 'PhonePe', true, 2),
  (gen_random_uuid(), 'Paytm', true, 3),
  (gen_random_uuid(), 'Amazon Pay', true, 4),
  (gen_random_uuid(), 'BHIM UPI', true, 5),
  (gen_random_uuid(), 'Other', true, 6);

-- Add OTP entry countdown setting (separate from the OTP confirmation countdown)
INSERT INTO public.app_settings (key, value) VALUES ('payment_otp_entry_countdown_seconds', '120')
ON CONFLICT (key) DO NOTHING;
