
-- Table for admin-created custom quick reply templates
CREATE TABLE public.custom_quick_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  template_text text NOT NULL,
  shortcut text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.custom_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom quick replies"
  ON public.custom_quick_replies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anon access to custom_quick_replies"
  ON public.custom_quick_replies FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX idx_custom_quick_replies_category ON public.custom_quick_replies(category);
CREATE INDEX idx_custom_quick_replies_active ON public.custom_quick_replies(is_active);
