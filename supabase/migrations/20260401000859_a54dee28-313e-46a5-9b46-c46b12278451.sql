
-- Add day_of_week and max_bookings columns to upgrade_chat_time_slots
ALTER TABLE public.upgrade_chat_time_slots 
  ADD COLUMN IF NOT EXISTS day_of_week integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_bookings integer NOT NULL DEFAULT 1;

-- Create upgrade_chat_day_settings table
CREATE TABLE IF NOT EXISTS public.upgrade_chat_day_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week integer NOT NULL UNIQUE,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.upgrade_chat_day_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for day settings
CREATE POLICY "Admins can manage day settings"
  ON public.upgrade_chat_day_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can read day settings"
  ON public.upgrade_chat_day_settings FOR SELECT TO authenticated
  USING (true);

-- Seed default day settings (0=Sunday through 6=Saturday)
INSERT INTO public.upgrade_chat_day_settings (day_of_week, is_closed) VALUES
  (0, false), (1, false), (2, false), (3, false), (4, false), (5, false), (6, false)
ON CONFLICT (day_of_week) DO NOTHING;
