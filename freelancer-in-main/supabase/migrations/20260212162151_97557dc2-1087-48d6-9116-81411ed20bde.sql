
-- Create enum for profile edit request status
CREATE TYPE public.edit_request_status AS ENUM ('none', 'requested', 'approved', 'rejected', 'used');

-- Add edit request tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN edit_request_status public.edit_request_status NOT NULL DEFAULT 'none',
  ADD COLUMN edit_request_reason text,
  ADD COLUMN edit_requested_at timestamptz,
  ADD COLUMN edit_reviewed_at timestamptz,
  ADD COLUMN edit_reviewed_by uuid REFERENCES public.profiles(id);
