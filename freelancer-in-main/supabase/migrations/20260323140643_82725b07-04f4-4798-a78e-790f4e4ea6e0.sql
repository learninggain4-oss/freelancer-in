-- Add wallet_type_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_type_id uuid REFERENCES public.wallet_types(id);

-- Create wallet_upgrade_requests table
CREATE TABLE public.wallet_upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  current_wallet_type text NOT NULL,
  requested_wallet_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage upgrade requests"
  ON public.wallet_upgrade_requests FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert own
CREATE POLICY "Users can insert own upgrade requests"
  ON public.wallet_upgrade_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view own
CREATE POLICY "Users can view own upgrade requests"
  ON public.wallet_upgrade_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Deny anon
CREATE POLICY "Deny anon access to wallet_upgrade_requests"
  ON public.wallet_upgrade_requests FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);