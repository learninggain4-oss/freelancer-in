
-- Chat rooms for project-based communication
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_chat_rooms_project ON public.chat_rooms(project_id);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to chat_rooms"
  ON public.chat_rooms FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Clients can view own project chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (project_id IN (
    SELECT id FROM public.projects
    WHERE client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Employees can view assigned project chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (project_id IN (
    SELECT id FROM public.projects
    WHERE assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Admins can manage chat_rooms"
  ON public.chat_rooms FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat_room ON public.messages(chat_room_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to messages"
  ON public.messages FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Chat participants can view messages"
  ON public.messages FOR SELECT
  USING (chat_room_id IN (
    SELECT cr.id FROM public.chat_rooms cr
    JOIN public.projects p ON p.id = cr.project_id
    WHERE p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Chat participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND chat_room_id IN (
      SELECT cr.id FROM public.chat_rooms cr
      JOIN public.projects p ON p.id = cr.project_id
      WHERE p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages read status"
  ON public.messages FOR UPDATE
  USING (chat_room_id IN (
    SELECT cr.id FROM public.chat_rooms cr
    JOIN public.projects p ON p.id = cr.project_id
    WHERE p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR p.assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Admins can manage messages"
  ON public.messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to notifications"
  ON public.notifications FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role / triggers to insert notifications
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
