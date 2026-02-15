
-- Fix: chat-attachments storage SELECT policy is too permissive
-- Currently allows ANY authenticated user to view ALL chat files
-- Restrict to: chat participants (client or assigned employee of the project) + admins + file uploader

DROP POLICY IF EXISTS "Authenticated users can view chat files" ON storage.objects;

CREATE POLICY "Chat participants can view chat files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- Admins can view all
    public.has_role(auth.uid(), 'admin'::public.app_role)
    -- File uploader can view their own files (path starts with their user_id)
    OR (storage.foldername(name))[1] = auth.uid()::text
    -- Project participants can view files from their chat rooms
    OR EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_rooms cr ON cr.id = m.chat_room_id
      JOIN public.projects p ON p.id = cr.project_id
      WHERE m.file_path = name
      AND (
        p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  )
);
