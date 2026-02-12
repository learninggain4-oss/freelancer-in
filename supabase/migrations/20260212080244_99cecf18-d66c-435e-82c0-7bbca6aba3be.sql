
-- Admin can view all documents in storage
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Admin can delete documents
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);
