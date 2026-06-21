
-- Create hero_slides table
CREATE TABLE public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  image_path text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slides (public landing page)
CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

-- Admins can manage all slides
CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for slide images
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-slides', 'hero-slides', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hero-slides bucket
CREATE POLICY "Anyone can view hero slide images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-slides');

CREATE POLICY "Admins can manage hero slide images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'hero-slides' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'hero-slides' AND has_role(auth.uid(), 'admin'::app_role));
