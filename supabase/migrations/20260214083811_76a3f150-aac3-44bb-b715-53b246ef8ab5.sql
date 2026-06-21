
-- Add file columns to bank_verifications
ALTER TABLE public.bank_verifications
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS document_name text;

-- Create storage bucket for bank verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-documents', 'bank-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload own bank documents
CREATE POLICY "Users can upload own bank docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bank-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can view own bank documents
CREATE POLICY "Users can view own bank docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bank-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- RLS: Users can update own bank documents
CREATE POLICY "Users can update own bank docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bank-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can delete own bank documents
CREATE POLICY "Users can delete own bank docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bank-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
