-- Allow employees to create support chat rooms for their own recovery requests
CREATE POLICY "Employees can create support chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'support'
  AND recovery_request_id IS NOT NULL
  AND recovery_request_id IN (
    SELECT rr.id FROM recovery_requests rr
    WHERE rr.employee_id IN (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
);
