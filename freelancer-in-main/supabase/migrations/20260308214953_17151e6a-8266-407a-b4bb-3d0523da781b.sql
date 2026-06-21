
-- Add coin_balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coin_balance integer NOT NULL DEFAULT 0;

-- Create coin_transactions table for audit trail
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Deny anon access to coin_transactions"
  ON public.coin_transactions FOR ALL
  USING (false) WITH CHECK (false);

CREATE POLICY "Users can view own coin transactions"
  ON public.coin_transactions FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage coin transactions"
  ON public.coin_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
