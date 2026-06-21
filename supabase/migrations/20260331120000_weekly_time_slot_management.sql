-- Weekly Time Slot Management Migration
-- Adds day_of_week and max_bookings to existing time slots table
-- Creates a new table to track per-day open/closed status

-- 1. Extend upgrade_chat_time_slots with weekly scheduling columns
ALTER TABLE public.upgrade_chat_time_slots
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_bookings INTEGER NOT NULL DEFAULT 1;

-- Constraint: day_of_week must be 0-6 (0=Sunday, 1=Monday, ... 6=Saturday)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_day_of_week'
      AND table_name = 'upgrade_chat_time_slots'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.upgrade_chat_time_slots
      ADD CONSTRAINT valid_day_of_week
      CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));
  END IF;
END$$;

-- Constraint: max_bookings must be at least 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_max_bookings'
      AND table_name = 'upgrade_chat_time_slots'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.upgrade_chat_time_slots
      ADD CONSTRAINT valid_max_bookings
      CHECK (max_bookings >= 1);
  END IF;
END$$;

-- 2. Create per-day open/closed settings table
CREATE TABLE IF NOT EXISTS public.upgrade_chat_day_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

-- 3. Enable RLS
ALTER TABLE public.upgrade_chat_day_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Admins can manage day settings"
  ON public.upgrade_chat_day_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read day settings"
  ON public.upgrade_chat_day_settings FOR SELECT
  TO authenticated
  USING (true);

-- 5. Auto-update trigger
CREATE TRIGGER update_day_settings_updated_at
  BEFORE UPDATE ON public.upgrade_chat_day_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed all 7 days as open (0=Sun, 1=Mon, ..., 6=Sat)
INSERT INTO public.upgrade_chat_day_settings (day_of_week, is_closed) VALUES
  (0, false),
  (1, false),
  (2, false),
  (3, false),
  (4, false),
  (5, false),
  (6, false)
ON CONFLICT (day_of_week) DO NOTHING;
