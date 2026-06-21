CREATE POLICY "Users can cancel own deposit requests"
ON public.deposit_requests
FOR UPDATE
TO authenticated
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));