
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can read active FAQs (public landing page)
CREATE POLICY "Anyone can view active faqs"
  ON public.faqs FOR SELECT
  USING (is_active = true);

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage faqs"
  ON public.faqs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
('Is it free to sign up?', 'Yes! Signing up, posting jobs, and searching for freelancers is completely free. We only charge a 2.9% handling fee on invoice payments.', 1),
('How does the verification process work?', 'After registration, your profile is reviewed and approved by our admin team within 6 hours. We verify your identity through WhatsApp and document verification to ensure authentic interactions.', 2),
('What payment methods are supported?', 'We support UPI transfers and bank transfers (NEFT/RTGS). All payments are processed securely through our platform with full transaction tracking.', 3),
('How do I get paid as a freelancer?', 'Once your project is validated and completed, your earnings are credited to your wallet. You can withdraw anytime via UPI or bank transfer.', 4),
('Can I hire multiple freelancers for a project?', 'Currently, each project is assigned to one freelancer. However, you can create multiple projects and assign different freelancers to each.', 5),
('What happens if there''s a dispute?', 'Our support team mediates all disputes. You can raise a recovery request and communicate through our dedicated support chat to resolve issues quickly.', 6);
