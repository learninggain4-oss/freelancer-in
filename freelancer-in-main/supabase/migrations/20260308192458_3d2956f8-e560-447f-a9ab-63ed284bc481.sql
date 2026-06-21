
CREATE TABLE public.admin_totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_secret text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.admin_totp_secrets ENABLE ROW LEVEL SECURITY;

-- Only admins can manage their own TOTP
CREATE POLICY "Admins can view own totp" ON public.admin_totp_secrets
  FOR SELECT USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert own totp" ON public.admin_totp_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update own totp" ON public.admin_totp_secrets
  FOR UPDATE USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete own totp" ON public.admin_totp_secrets
  FOR DELETE USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Deny anon access to admin_totp_secrets" ON public.admin_totp_secrets
  FOR ALL USING (false) WITH CHECK (false);
