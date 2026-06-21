
-- Table for user (employee/client) TOTP secrets
CREATE TABLE public.user_totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  encrypted_secret text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_totp_secrets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own TOTP
CREATE POLICY "Users can view own totp" ON public.user_totp_secrets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own totp" ON public.user_totp_secrets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own totp" ON public.user_totp_secrets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own totp" ON public.user_totp_secrets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can manage user totp" ON public.user_totp_secrets
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "Deny anon access to user_totp_secrets" ON public.user_totp_secrets
  FOR ALL TO anon USING (false) WITH CHECK (false);
