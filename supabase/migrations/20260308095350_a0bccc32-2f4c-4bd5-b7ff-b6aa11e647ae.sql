
-- Create trusted_companies table
CREATE TABLE public.trusted_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_path text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trusted_companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view active trusted companies (public landing page)
CREATE POLICY "Anyone can view active trusted companies"
  ON public.trusted_companies FOR SELECT
  USING (is_active = true);

-- Admins can manage trusted companies
CREATE POLICY "Admins can manage trusted companies"
  ON public.trusted_companies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Storage policies for company-logos bucket
CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can upload company logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update company logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete company logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed existing companies
INSERT INTO public.trusted_companies (name, display_order) VALUES
  ('TCS', 1),
  ('Infosys', 2),
  ('Wipro', 3),
  ('HCL Tech', 4),
  ('Tech Mahindra', 5),
  ('Accenture', 6),
  ('Cognizant', 7),
  ('Paytm', 8),
  ('Reliance', 9),
  ('Flipkart', 10),
  ('Razorpay', 11),
  ('Zoho', 12);
