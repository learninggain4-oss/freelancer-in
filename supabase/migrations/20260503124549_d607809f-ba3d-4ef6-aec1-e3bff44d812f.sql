
-- 1. Remove privilege-escalation INSERT policy on transactions
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

-- 2. Fix project-documents storage policies (ownership-scoped)
DROP POLICY IF EXISTS "Authenticated users can view project docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project docs" ON storage.objects;

CREATE POLICY "Project participants can view project docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.project_documents pd
      JOIN public.projects p ON p.id = pd.project_id
      WHERE pd.file_path = storage.objects.name
        AND (
          p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    )
  )
);

CREATE POLICY "Project participants can upload project docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE (storage.foldername(storage.objects.name))[1] = p.id::text
        AND (
          p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    )
  )
);

CREATE POLICY "Project participants can delete project docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-documents' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.project_documents pd
      JOIN public.profiles up ON up.id = pd.uploaded_by
      WHERE pd.file_path = storage.objects.name
        AND up.user_id = auth.uid()
    )
  )
);

-- 3. Fix chat-attachments view policy (broken m.file_path = p.name)
DROP POLICY IF EXISTS "Chat participants can view chat files" ON storage.objects;

CREATE POLICY "Chat participants can view chat files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.chat_rooms cr ON cr.id = m.chat_room_id
      JOIN public.projects p ON p.id = cr.project_id
      WHERE m.file_path = storage.objects.name
        AND (
          p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    )
  )
);

-- 4. Fix payment-attachments policies (broken (storage.foldername(p.name))[1] = (pc.id)::text)
DROP POLICY IF EXISTS "Project participants can upload payment attachments" ON storage.objects;
DROP POLICY IF EXISTS "Project participants can view payment attachments" ON storage.objects;

CREATE POLICY "Project participants can upload payment attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-attachments' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.payment_confirmations pc
      WHERE (storage.foldername(storage.objects.name))[1] = pc.id::text
        AND (
          pc.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = pc.project_id
              AND p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          )
        )
    )
  )
);

CREATE POLICY "Project participants can view payment attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-attachments' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.payment_confirmations pc
      WHERE (storage.foldername(storage.objects.name))[1] = pc.id::text
        AND (
          pc.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = pc.project_id
              AND p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          )
        )
    )
  )
);

-- 5. RLS on realtime.messages — scope subscription topics to caller's own user id
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own scoped channels" ON realtime.messages;
CREATE POLICY "Users can subscribe to own scoped channels"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE '%' || (auth.uid())::text || '%'
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || pr.id::text || '%'
  )
);

-- 6. Replace cron job hardcoded anon key with service role from settings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-expire-withdrawals') THEN
    PERFORM cron.unschedule('auto-expire-withdrawals');
  END IF;
END $$;

SELECT cron.schedule(
  'auto-expire-withdrawals',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://maysttckdfnnzvfeujaj.supabase.co/functions/v1/auto-expire-withdrawals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
