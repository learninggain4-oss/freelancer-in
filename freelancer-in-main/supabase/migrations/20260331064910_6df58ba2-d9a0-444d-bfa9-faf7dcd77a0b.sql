-- Create time slots table for wallet upgrade chat appointments
CREATE TABLE public.upgrade_chat_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_hour INTEGER NOT NULL,
  start_minute INTEGER NOT NULL DEFAULT 0,
  end_hour INTEGER NOT NULL,
  end_minute INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_start_hour CHECK (start_hour >= 0 AND start_hour <= 23),
  CONSTRAINT valid_end_hour CHECK (end_hour >= 0 AND end_hour <= 23),
  CONSTRAINT valid_start_minute CHECK (start_minute >= 0 AND start_minute <= 59),
  CONSTRAINT valid_end_minute CHECK (end_minute >= 0 AND end_minute <= 59)
);

-- Enable RLS
ALTER TABLE public.upgrade_chat_time_slots ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage time slots"
  ON public.upgrade_chat_time_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read enabled slots
CREATE POLICY "Authenticated users can read enabled time slots"
  ON public.upgrade_chat_time_slots FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Deny anon
CREATE POLICY "Deny anon access to time slots"
  ON public.upgrade_chat_time_slots FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Seed default time slots (9 AM to 6 PM, 1-hour intervals)
INSERT INTO public.upgrade_chat_time_slots (start_hour, start_minute, end_hour, end_minute, label, display_order, is_enabled) VALUES
  (9,  0, 10, 0, '🕐 9:00 AM - 10:00 AM',  1, true),
  (10, 0, 11, 0, '🕐 10:00 AM - 11:00 AM', 2, true),
  (11, 0, 12, 0, '🕐 11:00 AM - 12:00 PM', 3, true),
  (12, 0, 13, 0, '🕐 12:00 PM - 1:00 PM',  4, true),
  (13, 0, 14, 0, '🕐 1:00 PM - 2:00 PM',   5, true),
  (14, 0, 15, 0, '🕐 2:00 PM - 3:00 PM',   6, true),
  (15, 0, 16, 0, '🕐 3:00 PM - 4:00 PM',   7, true),
  (16, 0, 17, 0, '🕐 4:00 PM - 5:00 PM',   8, true),
  (17, 0, 18, 0, '🕐 5:00 PM - 6:00 PM',   9, true);

-- Updated at trigger
CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON public.upgrade_chat_time_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();