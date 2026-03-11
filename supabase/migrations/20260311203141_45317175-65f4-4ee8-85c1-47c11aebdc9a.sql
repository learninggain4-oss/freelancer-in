
-- Create user_bank_accounts table for multi-bank support (max 5 per user)
CREATE TABLE public.user_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_holder_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_ifsc_code TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on account number to prevent duplicates
CREATE UNIQUE INDEX idx_user_bank_accounts_account_number ON public.user_bank_accounts(bank_account_number);

-- Enable RLS
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access" ON public.user_bank_accounts
  AS RESTRICTIVE FOR ALL TO public
  USING (false) WITH CHECK (false);

-- Users can view own
CREATE POLICY "Users can view own bank accounts" ON public.user_bank_accounts
  AS RESTRICTIVE FOR SELECT TO public
  USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can insert own (max 5 enforced in app)
CREATE POLICY "Users can insert own bank accounts" ON public.user_bank_accounts
  AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Admins can manage all
CREATE POLICY "Admins can manage bank accounts" ON public.user_bank_accounts
  AS RESTRICTIVE FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update bank accounts" ON public.user_bank_accounts
  AS RESTRICTIVE FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
