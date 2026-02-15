
-- Create admin audit logs table for tracking all admin wallet actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_profile_id UUID REFERENCES public.profiles(id),
  target_profile_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon access
CREATE POLICY "Deny anon access to audit logs"
  ON public.admin_audit_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Index for fast lookups by target profile and date
CREATE INDEX idx_audit_logs_target ON public.admin_audit_logs(target_profile_id, created_at DESC);
CREATE INDEX idx_audit_logs_admin ON public.admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
