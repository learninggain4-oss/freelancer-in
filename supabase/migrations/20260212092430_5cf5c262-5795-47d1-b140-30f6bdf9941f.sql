
-- Add columns for message editing, deletion, and threading
ALTER TABLE public.messages
ADD COLUMN edited_at timestamp with time zone DEFAULT NULL,
ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN parent_message_id uuid DEFAULT NULL REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for thread lookups
CREATE INDEX idx_messages_parent ON public.messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: Deny anon
CREATE POLICY "Deny anon access to reactions"
ON public.message_reactions FOR ALL
USING (false)
WITH CHECK (false);

-- RLS: Chat participants can view reactions
CREATE POLICY "Chat participants can view reactions"
ON public.message_reactions FOR SELECT
USING (
  message_id IN (
    SELECT m.id FROM public.messages m
    JOIN public.chat_rooms cr ON cr.id = m.chat_room_id
    JOIN public.projects p ON p.id = cr.project_id
    WHERE p.client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
       OR p.assigned_employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- RLS: Authenticated users can add reactions to messages they can see
CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND message_id IN (
    SELECT m.id FROM public.messages m
    JOIN public.chat_rooms cr ON cr.id = m.chat_room_id
    JOIN public.projects p ON p.id = cr.project_id
    WHERE p.client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
       OR p.assigned_employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- RLS: Users can remove own reactions
CREATE POLICY "Users can remove own reactions"
ON public.message_reactions FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS: Admins can manage reactions
CREATE POLICY "Admins can manage reactions"
ON public.message_reactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow message senders to update their own messages (for editing)
-- The existing RLS allows update for read status; we need senders to edit content too.
-- The existing UPDATE policy covers chat participants, which is fine.
