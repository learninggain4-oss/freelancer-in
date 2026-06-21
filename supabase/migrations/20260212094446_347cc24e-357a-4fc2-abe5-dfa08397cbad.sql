
-- Add IP address and geolocation columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_ip text,
  ADD COLUMN IF NOT EXISTS registration_city text,
  ADD COLUMN IF NOT EXISTS registration_region text,
  ADD COLUMN IF NOT EXISTS registration_country text,
  ADD COLUMN IF NOT EXISTS registration_latitude numeric,
  ADD COLUMN IF NOT EXISTS registration_longitude numeric;
