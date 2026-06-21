
-- Create blocked_ips table
CREATE TABLE public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  reason text,
  blocked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  blocked_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Admin-only management
CREATE POLICY "Admins can manage blocked_ips"
  ON public.blocked_ips
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon access
CREATE POLICY "Deny anon access to blocked_ips"
  ON public.blocked_ips
  FOR ALL
  USING (false)
  WITH CHECK (false);
