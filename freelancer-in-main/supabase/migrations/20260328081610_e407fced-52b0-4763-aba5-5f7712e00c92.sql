
-- Auto Response Messages table for wallet upgrade chat
CREATE TABLE public.upgrade_auto_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_key text NOT NULL UNIQUE,
  message_text text NOT NULL DEFAULT '',
  buttons jsonb DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  typing_enabled boolean NOT NULL DEFAULT true,
  typing_duration_seconds integer NOT NULL DEFAULT 10,
  trigger_type text NOT NULL DEFAULT 'button_click',
  trigger_value text DEFAULT NULL,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.upgrade_auto_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto responses"
  ON public.upgrade_auto_responses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read enabled auto responses"
  ON public.upgrade_auto_responses FOR SELECT
  TO authenticated
  USING (is_enabled = true);
