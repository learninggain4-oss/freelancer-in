
-- Payment confirmations for OTP-based payment verification in validation chat
CREATE TABLE public.payment_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id),
  payment_method text,
  phone_number text,
  otp text,
  otp_submitted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'initiated',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access to payment_confirmations"
ON public.payment_confirmations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Admin full access
CREATE POLICY "Admins can manage payment_confirmations"
ON public.payment_confirmations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Employees can view own
CREATE POLICY "Employees can view own payment confirmations"
ON public.payment_confirmations
FOR SELECT
TO authenticated
USING (employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Employees can update own (submit payment details and OTP)
CREATE POLICY "Employees can update own payment confirmations"
ON public.payment_confirmations
FOR UPDATE
TO authenticated
USING (employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Clients can view for their projects
CREATE POLICY "Clients can view project payment confirmations"
ON public.payment_confirmations
FOR SELECT
TO authenticated
USING (project_id IN (SELECT id FROM projects WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Clients can insert (initiate payment confirmation)
CREATE POLICY "Clients can create payment confirmations"
ON public.payment_confirmations
FOR INSERT
TO authenticated
WITH CHECK (project_id IN (SELECT id FROM projects WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Clients can update status (success/failure)
CREATE POLICY "Clients can update payment confirmation status"
ON public.payment_confirmations
FOR UPDATE
TO authenticated
USING (project_id IN (SELECT id FROM projects WHERE client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_payment_confirmations_updated_at
BEFORE UPDATE ON public.payment_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add default countdown setting (60 seconds)
INSERT INTO public.app_settings (key, value)
VALUES ('payment_otp_countdown_seconds', '60')
ON CONFLICT (key) DO NOTHING;

-- Index for fast lookup
CREATE INDEX idx_payment_confirmations_project ON public.payment_confirmations(project_id);
CREATE INDEX idx_payment_confirmations_status ON public.payment_confirmations(status);
