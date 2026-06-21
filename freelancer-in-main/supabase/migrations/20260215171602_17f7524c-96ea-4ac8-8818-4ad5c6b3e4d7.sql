
-- Reactions on support messages
CREATE TABLE public.support_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.support_message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can see reactions in their conversations
CREATE POLICY "Users can view support reactions"
ON public.support_message_reactions FOR SELECT TO authenticated
USING (
  message_id IN (
    SELECT sm.id FROM support_messages sm
    JOIN support_conversations sc ON sc.id = sm.conversation_id
    WHERE sc.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Users can add reactions
CREATE POLICY "Users can add support reactions"
ON public.support_message_reactions FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND (
    message_id IN (
      SELECT sm.id FROM support_messages sm
      JOIN support_conversations sc ON sc.id = sm.conversation_id
      WHERE sc.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Users can remove own reactions
CREATE POLICY "Users can remove own support reactions"
ON public.support_message_reactions FOR DELETE TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_support_reactions_message ON public.support_message_reactions(message_id);
