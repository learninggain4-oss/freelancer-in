
-- Create aadhaar verification status enum
CREATE TYPE public.aadhaar_verification_status AS ENUM ('not_submitted', 'pending', 'verified', 'rejected');

-- Create aadhaar_verifications table
CREATE TABLE public.aadhaar_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aadhaar_number text NOT NULL,
  name_on_aadhaar text NOT NULL,
  dob_on_aadhaar date NOT NULL,
  address_on_aadhaar text NOT NULL,
  front_image_path text NOT NULL,
  back_image_path text NOT NULL,
  status public.aadhaar_verification_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.aadhaar_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anon access" ON public.aadhaar_verifications FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Users can view own verification" ON public.aadhaar_verifications FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own verification" ON public.aadhaar_verifications FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own pending verification" ON public.aadhaar_verifications FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND status IN ('not_submitted', 'rejected'));

CREATE POLICY "Admins can view all verifications" ON public.aadhaar_verifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verifications" ON public.aadhaar_verifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_aadhaar_verifications_updated_at
  BEFORE UPDATE ON public.aadhaar_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for aadhaar documents
INSERT INTO storage.buckets (id, name, public) VALUES ('aadhaar-documents', 'aadhaar-documents', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload aadhaar docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'aadhaar-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own aadhaar docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'aadhaar-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all aadhaar docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'aadhaar-documents' AND has_role(auth.uid(), 'admin'));
