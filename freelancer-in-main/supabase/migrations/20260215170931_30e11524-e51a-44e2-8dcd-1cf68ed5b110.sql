
-- Support conversations: one per user, private 1:1 with admin
CREATE TABLE public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Support messages
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL DEFAULT '',
  file_path TEXT,
  file_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own conversation
CREATE POLICY "Users can view own support conversation"
ON public.support_conversations FOR SELECT TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Users can create their own conversation
CREATE POLICY "Users can create own support conversation"
ON public.support_conversations FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Users can update their own conversation (for updated_at)
CREATE POLICY "Users or admin can update support conversation"
ON public.support_conversations FOR UPDATE TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Messages - users can see messages in their conversations, admins can see all
CREATE POLICY "Users can view own support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM support_conversations
    WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Messages - users and admins can send messages
CREATE POLICY "Users can send support messages"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND (
    conversation_id IN (
      SELECT id FROM support_conversations
      WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- RLS: Messages - update for marking as read
CREATE POLICY "Users or admin can update support messages"
ON public.support_messages FOR UPDATE TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM support_conversations
    WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Indexes
CREATE INDEX idx_support_messages_conversation ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created ON public.support_messages(created_at);
CREATE INDEX idx_support_conversations_user ON public.support_conversations(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
