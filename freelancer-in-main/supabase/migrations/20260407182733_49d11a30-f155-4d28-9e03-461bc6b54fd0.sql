-- Fix payment-attachments storage policies: restrict to project participants and admins

DROP POLICY IF EXISTS "Project participants can view payment attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment attachments" ON storage.objects;

CREATE POLICY "Project participants can view payment attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-attachments' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    EXISTS (
      SELECT 1 FROM public.payment_confirmations pc
      JOIN public.projects p ON p.id = pc.project_id
      WHERE (storage.foldername(name))[1] = pc.id::text
      AND (
        pc.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  )
);

CREATE POLICY "Project participants can upload payment attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-attachments' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    EXISTS (
      SELECT 1 FROM public.payment_confirmations pc
      JOIN public.projects p ON p.id = pc.project_id
      WHERE (storage.foldername(name))[1] = pc.id::text
      AND (
        pc.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  )
);