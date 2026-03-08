
-- Reviews table for ratings & reviews after project completion
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access to reviews"
  ON public.reviews FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Admins full access
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can insert reviews for completed projects they participated in
CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND project_id IN (
      SELECT id FROM projects 
      WHERE status = 'completed' 
      AND (
        client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR assigned_employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

-- Users can view reviews about themselves or that they wrote
CREATE POLICY "Users can view relevant reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (
    reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR reviewee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Anyone authenticated can view reviews (for profile display)
CREATE POLICY "Authenticated users can view all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);
