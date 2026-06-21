
-- Add account number digits to banks table
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS account_number_digits integer DEFAULT NULL;

-- Create bank IFSC codes table
CREATE TABLE IF NOT EXISTS public.bank_ifsc_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id uuid REFERENCES public.banks(id) ON DELETE CASCADE NOT NULL,
  ifsc_code text NOT NULL,
  branch_name text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_ifsc_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read IFSC codes
CREATE POLICY "Anyone can read IFSC codes" ON public.bank_ifsc_codes
  FOR SELECT TO authenticated USING (true);

-- Allow admins to manage IFSC codes
CREATE POLICY "Admins can manage IFSC codes" ON public.bank_ifsc_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_ifsc_codes_bank_id ON public.bank_ifsc_codes(bank_id);
CREATE INDEX IF NOT EXISTS idx_bank_ifsc_codes_ifsc ON public.bank_ifsc_codes(ifsc_code);
