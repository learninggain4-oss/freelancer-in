
-- Create recovery_requests table for tracking Help - Recovery Money requests
CREATE TABLE public.recovery_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  held_amount NUMERIC NOT NULL DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own recovery requests
CREATE POLICY "Employees can view own recovery requests"
ON public.recovery_requests FOR SELECT
TO authenticated
USING (
  employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Employees can create recovery requests for their own cancelled projects
CREATE POLICY "Employees can create recovery requests"
ON public.recovery_requests FOR INSERT
TO authenticated
WITH CHECK (
  employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Admins can view all recovery requests
CREATE POLICY "Admins can view all recovery requests"
ON public.recovery_requests FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Admins can update recovery requests
CREATE POLICY "Admins can update recovery requests"
ON public.recovery_requests FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Add type column to chat_rooms to distinguish project vs support chats
ALTER TABLE public.chat_rooms ADD COLUMN type TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project', 'support'));

-- Add recovery_request_id to chat_rooms for support chats
ALTER TABLE public.chat_rooms ADD COLUMN recovery_request_id UUID REFERENCES public.recovery_requests(id);

-- Allow admin to read/write messages in support chat rooms
-- (existing RLS on messages should cover this via chat_room membership, but let's ensure admins can access)
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
