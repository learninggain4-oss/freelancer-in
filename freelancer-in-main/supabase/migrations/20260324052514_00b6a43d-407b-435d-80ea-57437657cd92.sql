
-- Create upgrade request messages table
CREATE TABLE public.upgrade_request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_request_id uuid NOT NULL REFERENCES public.wallet_upgrade_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upgrade_request_messages ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage upgrade messages"
  ON public.upgrade_request_messages
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert own messages (where they own the upgrade request)
CREATE POLICY "Users can send upgrade messages"
  ON public.upgrade_request_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND upgrade_request_id IN (
      SELECT id FROM wallet_upgrade_requests WHERE user_id = auth.uid()
    )
  );

-- Users can view messages on their own upgrade requests
CREATE POLICY "Users can view own upgrade messages"
  ON public.upgrade_request_messages
  FOR SELECT
  TO authenticated
  USING (
    upgrade_request_id IN (
      SELECT id FROM wallet_upgrade_requests WHERE user_id = auth.uid()
    )
  );

-- Users can update read status on their own upgrade request messages
CREATE POLICY "Users can update read status"
  ON public.upgrade_request_messages
  FOR UPDATE
  TO authenticated
  USING (
    upgrade_request_id IN (
      SELECT id FROM wallet_upgrade_requests WHERE user_id = auth.uid()
    )
  );

-- Deny anon
CREATE POLICY "Deny anon access"
  ON public.upgrade_request_messages
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.upgrade_request_messages;
