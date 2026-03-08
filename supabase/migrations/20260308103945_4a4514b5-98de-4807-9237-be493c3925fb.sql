
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  quote text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active testimonials"
  ON public.testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.testimonials (name, role, quote, rating, display_order) VALUES
('Rajesh Kumar', 'Startup Founder', 'Freelancer helped us find talented developers quickly. The payment system is transparent and the project management tools are excellent.', 5, 1),
('Priya Sharma', 'Marketing Director', 'The verification process gives us confidence in every hire. We''ve completed over 20 projects seamlessly through this platform.', 5, 2),
('Amit Patel', 'Small Business Owner', 'Real-time chat and file sharing made collaboration effortless. The secure UPI payments are a huge plus for Indian businesses.', 4, 3);
