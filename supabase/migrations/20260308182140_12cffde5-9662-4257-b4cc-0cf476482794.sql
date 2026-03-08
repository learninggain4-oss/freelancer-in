
-- Create site_visitors table for tracking all visitors
CREATE TABLE public.site_visitors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text,
  user_agent text,
  page_path text,
  referrer text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  city text,
  country text,
  device_type text
);

-- Enable RLS
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (visitors aren't authenticated)
CREATE POLICY "Anyone can insert visits" ON public.site_visitors
  FOR INSERT WITH CHECK (true);

-- Only admins can view visits
CREATE POLICY "Admins can view all visits" ON public.site_visitors
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage visits
CREATE POLICY "Admins can manage visits" ON public.site_visitors
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon select
CREATE POLICY "Deny anon select" ON public.site_visitors
  FOR SELECT USING (false);

-- Index for performance
CREATE INDEX idx_site_visitors_visited_at ON public.site_visitors(visited_at DESC);
CREATE INDEX idx_site_visitors_ip ON public.site_visitors(ip_address);
CREATE INDEX idx_site_visitors_profile_id ON public.site_visitors(profile_id);
