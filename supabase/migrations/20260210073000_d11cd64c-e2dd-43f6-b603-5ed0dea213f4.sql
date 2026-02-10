
-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('employee', 'client');

-- Create enum for approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for gender
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- Create enum for marital status
CREATE TYPE public.marital_status_type AS ENUM ('single', 'married', 'divorced', 'widowed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type public.user_type NOT NULL,
  user_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  gender public.gender_type,
  date_of_birth DATE,
  marital_status public.marital_status_type,
  education_level TEXT,
  mobile_number TEXT,
  whatsapp_number TEXT,
  email TEXT NOT NULL,
  
  -- Professional details
  previous_job_details TEXT,
  work_experience TEXT,
  education_background TEXT,
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  
  -- Approval
  approval_status public.approval_status NOT NULL DEFAULT 'pending',
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Financial (for employees)
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  hold_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- Create documents table for verification uploads
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Documents RLS policies
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can upload their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Auto-generate user codes
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.user_type = 'employee' THEN
    prefix := 'EMP';
  ELSE
    prefix := 'CLT';
  END IF;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(user_code FROM 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.profiles
  WHERE user_type = NEW.user_type AND user_code IS NOT NULL;
  
  NEW.user_code := prefix || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_user_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_code();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
