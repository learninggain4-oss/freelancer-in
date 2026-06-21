
-- Create enum for bank verification status
CREATE TYPE public.bank_verification_status AS ENUM ('pending', 'under_process', 'verified', 'rejected');

-- Create bank_verifications table
CREATE TABLE public.bank_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status bank_verification_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.bank_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anon access" ON public.bank_verifications FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Users can view own verification" ON public.bank_verifications FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own verification" ON public.bank_verifications FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all" ON public.bank_verifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all" ON public.bank_verifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all" ON public.bank_verifications FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_bank_verifications_updated_at
  BEFORE UPDATE ON public.bank_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
