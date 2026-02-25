
-- Create countdowns table for managing countdown names and durations
CREATE TABLE public.countdowns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  is_cleared boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;

-- Admin-only management
CREATE POLICY "Admins can manage countdowns"
ON public.countdowns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read active countdowns
CREATE POLICY "Authenticated users can read active countdowns"
ON public.countdowns
FOR SELECT
USING (is_active = true AND is_cleared = false);

-- Deny anonymous access
CREATE POLICY "Deny anon access to countdowns"
ON public.countdowns
FOR ALL
USING (false)
WITH CHECK (false);

-- Indexes
CREATE INDEX idx_countdowns_active ON public.countdowns (is_active, is_cleared);

-- Update trigger
CREATE TRIGGER update_countdowns_updated_at
BEFORE UPDATE ON public.countdowns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
