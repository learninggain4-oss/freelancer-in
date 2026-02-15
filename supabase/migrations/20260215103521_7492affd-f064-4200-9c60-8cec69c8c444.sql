-- Drop the overly restrictive unique index that prevents multiple chat room types per project
DROP INDEX IF EXISTS public.idx_chat_rooms_project;

-- Create a new composite unique index allowing one chat room per project per type
CREATE UNIQUE INDEX idx_chat_rooms_project_type ON public.chat_rooms (project_id, type);