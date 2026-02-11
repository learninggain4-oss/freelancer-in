
-- Tighten the notifications insert policy to authenticated users only
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
