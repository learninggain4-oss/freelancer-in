
-- Table to track PWA install prompt status per user
CREATE TABLE public.pwa_install_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_installed boolean NOT NULL DEFAULT false,
  is_standalone boolean NOT NULL DEFAULT false,
  prompt_shown boolean NOT NULL DEFAULT false,
  prompt_accepted boolean DEFAULT null,
  user_agent text,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

ALTER TABLE public.pwa_install_status ENABLE ROW LEVEL SECURITY;

-- Users can manage own install status
CREATE POLICY "Users can upsert own install status" ON public.pwa_install_status
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can view all
CREATE POLICY "Admins can manage all install status" ON public.pwa_install_status
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "Deny anon access to pwa_install_status" ON public.pwa_install_status
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);
