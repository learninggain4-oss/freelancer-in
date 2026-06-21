
ALTER TABLE public.announcements
  ADD COLUMN target_user_ids UUID[] DEFAULT NULL;

COMMENT ON COLUMN public.announcements.target_user_ids IS 'When set, only these specific users see the announcement. NULL means all users in the target_audience.';
