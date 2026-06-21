
-- Add disabled flag to profiles
ALTER TABLE public.profiles ADD COLUMN is_disabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN disabled_reason text;
