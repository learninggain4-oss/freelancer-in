
-- Create wallet_types table
CREATE TABLE public.wallet_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Wallet',
  color TEXT NOT NULL DEFAULT '#2563EB',
  min_balance NUMERIC NOT NULL DEFAULT 0,
  max_balance NUMERIC NOT NULL DEFAULT 0,
  daily_withdrawal_limit NUMERIC NOT NULL DEFAULT 0,
  transaction_limit NUMERIC NOT NULL DEFAULT 0,
  perks TEXT[] NOT NULL DEFAULT '{}',
  upgrade_requirements TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_cleared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_types ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access to wallet_types" ON public.wallet_types AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Authenticated users can view active wallet types
CREATE POLICY "Users can view active wallet_types" ON public.wallet_types FOR SELECT TO authenticated USING (is_active = true AND is_cleared = false);

-- Admins full CRUD
CREATE POLICY "Admins can manage wallet_types" ON public.wallet_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
