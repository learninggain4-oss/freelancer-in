
-- Allow employees to view support chat rooms linked to their recovery requests
CREATE POLICY "Employees can view own support chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  type = 'support' AND recovery_request_id IN (
    SELECT id FROM recovery_requests
    WHERE employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Allow employees to send messages in support chat rooms they have access to
CREATE POLICY "Employees can send in support chat rooms"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND chat_room_id IN (
    SELECT cr.id FROM chat_rooms cr
    JOIN recovery_requests rr ON rr.id = cr.recovery_request_id
    WHERE cr.type = 'support'
    AND rr.employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Allow employees to view messages in support chat rooms
CREATE POLICY "Employees can view support chat messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  chat_room_id IN (
    SELECT cr.id FROM chat_rooms cr
    JOIN recovery_requests rr ON rr.id = cr.recovery_request_id
    WHERE cr.type = 'support'
    AND rr.employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);
