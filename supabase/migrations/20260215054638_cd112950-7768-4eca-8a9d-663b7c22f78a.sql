
-- Table to store admin announcements/popup messages
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('everyone', 'employees', 'clients')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track which users dismissed an announcement
CREATE TABLE public.announcement_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Announcements: admins can do everything, authenticated users can read active ones
CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read active announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (is_active = true);

-- Dismissals: users can insert their own, read their own
CREATE POLICY "Users can dismiss announcements"
ON public.announcement_dismissals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own dismissals"
ON public.announcement_dismissals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all dismissals
CREATE POLICY "Admins can read all dismissals"
ON public.announcement_dismissals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
