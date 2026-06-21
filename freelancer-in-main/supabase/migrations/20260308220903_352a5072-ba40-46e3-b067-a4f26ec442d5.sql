
-- Add photo path columns to attendance table
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS check_in_photo_path text,
  ADD COLUMN IF NOT EXISTS check_out_photo_path text;

-- Create storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attendance-photos bucket
CREATE POLICY "Users can upload own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage attendance photos"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
