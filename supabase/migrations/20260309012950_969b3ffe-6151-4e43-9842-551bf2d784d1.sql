
-- Create banks table for admin-managed bank list with logos
CREATE TABLE public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_path text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Everyone can read active banks
CREATE POLICY "Anyone can read active banks"
  ON public.banks FOR SELECT
  USING (is_active = true);

-- Admins can manage banks
CREATE POLICY "Admins can manage banks"
  ON public.banks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for bank logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-logos', 'bank-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: admins can upload bank logos
CREATE POLICY "Admins can manage bank logos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'bank-logos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'bank-logos' AND public.has_role(auth.uid(), 'admin'));

-- Public can view bank logos
CREATE POLICY "Public can view bank logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-logos');

-- Seed with common Indian banks
INSERT INTO public.banks (name, display_order) VALUES
  ('State Bank of India (SBI)', 1),
  ('HDFC Bank', 2),
  ('ICICI Bank', 3),
  ('Punjab National Bank (PNB)', 4),
  ('Bank of Baroda', 5),
  ('Canara Bank', 6),
  ('Axis Bank', 7),
  ('Union Bank of India', 8),
  ('Bank of India', 9),
  ('Indian Bank', 10),
  ('Central Bank of India', 11),
  ('Indian Overseas Bank', 12),
  ('UCO Bank', 13),
  ('IDBI Bank', 14),
  ('Kotak Mahindra Bank', 15),
  ('IndusInd Bank', 16),
  ('Yes Bank', 17),
  ('Federal Bank', 18),
  ('South Indian Bank', 19),
  ('RBL Bank', 20),
  ('Bandhan Bank', 21),
  ('IDFC First Bank', 22),
  ('Karnataka Bank', 23),
  ('City Union Bank', 24),
  ('Karur Vysya Bank', 25),
  ('Tamilnad Mercantile Bank', 26),
  ('DCB Bank', 27),
  ('Jammu & Kashmir Bank', 28),
  ('Punjab & Sind Bank', 29),
  ('Bank of Maharashtra', 30),
  ('India Post Payments Bank', 31),
  ('Paytm Payments Bank', 32),
  ('Airtel Payments Bank', 33),
  ('Fino Payments Bank', 34);

-- Updated_at trigger
CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
