
-- Table for storing legal documents (privacy policy, terms of service)
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can view legal documents"
  ON public.legal_documents FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert legal documents"
  ON public.legal_documents FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update legal documents"
  ON public.legal_documents FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete legal documents"
  ON public.legal_documents FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "Deny anon access to legal_documents"
  ON public.legal_documents FOR ALL
  USING (false)
  WITH CHECK (false);

-- Seed default documents
INSERT INTO public.legal_documents (slug, title, content) VALUES
('privacy-policy', 'Privacy Policy', '# Privacy Policy

Your privacy policy content goes here. An admin can edit this from the Admin Panel.'),
('terms-of-service', 'Terms of Service', '# Terms of Service

Your terms of service content goes here. An admin can edit this from the Admin Panel.');
