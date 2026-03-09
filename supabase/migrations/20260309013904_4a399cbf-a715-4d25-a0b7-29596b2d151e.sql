
-- Create employee_payment_apps table
CREATE TABLE public.employee_payment_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  phone_number text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id, payment_method_id)
);

-- Enable RLS
ALTER TABLE public.employee_payment_apps ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access" ON public.employee_payment_apps AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Users can view own
CREATE POLICY "Users can view own payment apps" ON public.employee_payment_apps FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert own
CREATE POLICY "Users can insert own payment apps" ON public.employee_payment_apps FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update own
CREATE POLICY "Users can update own payment apps" ON public.employee_payment_apps FOR UPDATE TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete own
CREATE POLICY "Users can delete own payment apps" ON public.employee_payment_apps FOR DELETE TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can manage all
CREATE POLICY "Admins can manage payment apps" ON public.employee_payment_apps FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
