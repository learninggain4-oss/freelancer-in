
-- Add wallet_number and profile_photo_path columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_photo_path text;

-- Create function to auto-generate unique 12-digit wallet number
CREATE OR REPLACE FUNCTION public.generate_wallet_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_number text;
  attempts integer := 0;
BEGIN
  IF NEW.wallet_number IS NULL OR NEW.wallet_number = '' THEN
    LOOP
      -- Generate a random 12-digit number (starting with non-zero)
      new_number := (floor(random() * 9 + 1))::text || lpad(floor(random() * 100000000000)::bigint::text, 11, '0');
      -- Check uniqueness
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE wallet_number = new_number);
      attempts := attempts + 1;
      IF attempts > 100 THEN
        RAISE EXCEPTION 'Could not generate unique wallet number';
      END IF;
    END LOOP;
    NEW.wallet_number := new_number;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating wallet numbers on insert
CREATE TRIGGER generate_wallet_number_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_wallet_number();

-- Backfill existing profiles with wallet numbers
DO $$
DECLARE
  rec RECORD;
  new_number text;
  attempts integer;
BEGIN
  FOR rec IN SELECT id FROM profiles WHERE wallet_number IS NULL LOOP
    attempts := 0;
    LOOP
      new_number := (floor(random() * 9 + 1))::text || lpad(floor(random() * 100000000000)::bigint::text, 11, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE wallet_number = new_number);
      attempts := attempts + 1;
      IF attempts > 100 THEN
        RAISE EXCEPTION 'Could not generate unique wallet number';
      END IF;
    END LOOP;
    UPDATE profiles SET wallet_number = new_number WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile-photos bucket
CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own profile photo"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage profile photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'profile-photos'
  AND public.has_role(auth.uid(), 'admin')
);
