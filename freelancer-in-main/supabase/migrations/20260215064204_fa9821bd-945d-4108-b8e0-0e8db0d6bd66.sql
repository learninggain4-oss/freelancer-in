
-- Create a separate admin-only table for sensitive registration metadata (IP, geolocation)
CREATE TABLE public.registration_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address text,
  city text,
  region text,
  country text,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registration_metadata ENABLE ROW LEVEL SECURITY;

-- Only admins can read this table
CREATE POLICY "Admins can view registration metadata"
ON public.registration_metadata
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can manage this table
CREATE POLICY "Admins can manage registration metadata"
ON public.registration_metadata
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Deny anonymous access
CREATE POLICY "Deny anon access to registration_metadata"
ON public.registration_metadata
FOR ALL
USING (false)
WITH CHECK (false);

-- Allow authenticated users to insert their own metadata (during registration)
CREATE POLICY "Users can insert own registration metadata"
ON public.registration_metadata
FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Migrate existing data from profiles to registration_metadata
INSERT INTO public.registration_metadata (profile_id, ip_address, city, region, country, latitude, longitude)
SELECT id, registration_ip, registration_city, registration_region, registration_country, registration_latitude, registration_longitude
FROM public.profiles
WHERE registration_ip IS NOT NULL OR registration_city IS NOT NULL;

-- Null out the sensitive columns in profiles
UPDATE public.profiles SET
  registration_ip = NULL,
  registration_city = NULL,
  registration_region = NULL,
  registration_country = NULL,
  registration_latitude = NULL,
  registration_longitude = NULL;
