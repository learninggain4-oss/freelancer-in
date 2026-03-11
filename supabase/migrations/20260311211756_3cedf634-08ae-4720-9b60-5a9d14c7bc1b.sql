
-- Create user_reviews table for general feedback
CREATE TABLE public.user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  photo_path TEXT,
  photo_name TEXT,
  admin_response TEXT,
  is_cleared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access to user_reviews" ON public.user_reviews AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);

-- Users can insert own reviews
CREATE POLICY "Users can insert own reviews" ON public.user_reviews AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can view own reviews
CREATE POLICY "Users can view own reviews" ON public.user_reviews AS RESTRICTIVE FOR SELECT TO authenticated
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins full access
CREATE POLICY "Admins can manage reviews" ON public.user_reviews AS RESTRICTIVE FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', false);

-- Storage RLS: users can upload own review photos
CREATE POLICY "Users can upload review photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view own review photos
CREATE POLICY "Users can view own review photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all review photos
CREATE POLICY "Admins can view all review photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete review photos
CREATE POLICY "Admins can delete review photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-photos' AND has_role(auth.uid(), 'admin'::app_role));
