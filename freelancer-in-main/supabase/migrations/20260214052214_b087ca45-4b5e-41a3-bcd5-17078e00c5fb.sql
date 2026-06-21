
-- Drop the authenticated-only select and the blanket deny, replace with public read access
DROP POLICY "Authenticated users can view legal documents" ON public.legal_documents;
DROP POLICY "Deny anon access to legal_documents" ON public.legal_documents;

-- Allow anyone (including anon) to read legal documents
CREATE POLICY "Anyone can view legal documents"
  ON public.legal_documents FOR SELECT
  USING (true);
