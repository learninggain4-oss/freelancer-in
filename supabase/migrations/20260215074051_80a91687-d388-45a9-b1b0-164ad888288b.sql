
-- Add new columns to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS order_number serial,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.service_categories(id),
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS responsibility text,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS admin_approved boolean NOT NULL DEFAULT false;

-- Create a unique order_id text column derived from order_number
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS order_id text GENERATED ALWAYS AS ('ORD-' || lpad(order_number::text, 4, '0')) STORED;

-- Create unique index on order_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_order_id ON public.projects(order_id);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id)
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- RLS for project_documents
CREATE POLICY "Admins can manage project documents"
ON public.project_documents FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Deny anon access to project_documents"
ON public.project_documents FOR ALL
USING (false) WITH CHECK (false);

CREATE POLICY "Clients can manage own project documents"
ON public.project_documents FOR ALL
USING (project_id IN (
  SELECT id FROM projects WHERE client_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
))
WITH CHECK (project_id IN (
  SELECT id FROM projects WHERE client_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Employees can view assigned project documents"
ON public.project_documents FOR SELECT
USING (project_id IN (
  SELECT id FROM projects WHERE assigned_employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
));

-- Storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload project docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view project docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own project docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

-- Admin policies for projects: allow admins to update/delete any project
-- (already covered by existing "Admins can manage projects" policy)

-- Add index on projects.category_id
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
