
-- Table to track template usage analytics
CREATE TABLE public.quick_reply_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_text text NOT NULL,
  category text NOT NULL,
  used_by uuid NOT NULL,
  conversation_id uuid REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_reply_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quick reply analytics"
  ON public.quick_reply_analytics FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anon access to quick_reply_analytics"
  ON public.quick_reply_analytics FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX idx_quick_reply_analytics_template ON public.quick_reply_analytics(template_text);
CREATE INDEX idx_quick_reply_analytics_created ON public.quick_reply_analytics(created_at);
