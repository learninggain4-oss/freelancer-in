
-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Users can view own attendance
CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert own attendance
CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update own attendance
CREATE POLICY "Users can update own attendance"
  ON public.attendance FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can manage all attendance
CREATE POLICY "Admins can manage attendance"
  ON public.attendance FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon access
CREATE POLICY "Deny anon access to attendance"
  ON public.attendance FOR ALL
  USING (false)
  WITH CHECK (false);
