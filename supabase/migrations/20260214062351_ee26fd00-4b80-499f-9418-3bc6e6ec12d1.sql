
-- 1. Service Categories (admin-managed)
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage service categories" ON public.service_categories FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon write to service_categories" ON public.service_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Service Skills (admin-managed, linked to category)
CREATE TABLE public.service_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);
ALTER TABLE public.service_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service skills" ON public.service_skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage service skills" ON public.service_skills FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon write to service_skills" ON public.service_skills FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Employee Services (linking employees to skills with their service info)
CREATE TABLE public.employee_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_title text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.service_categories(id),
  hourly_rate numeric NOT NULL DEFAULT 0,
  minimum_budget numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employee services" ON public.employee_services FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own employee services" ON public.employee_services FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own employee services" ON public.employee_services FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage employee services" ON public.employee_services FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to employee_services" ON public.employee_services FOR ALL USING (false) WITH CHECK (false);

-- 4. Employee Skills (many-to-many between employee_services and skills)
CREATE TABLE public.employee_skill_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_service_id uuid NOT NULL REFERENCES public.employee_services(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.service_skills(id) ON DELETE CASCADE,
  UNIQUE(employee_service_id, skill_id)
);
ALTER TABLE public.employee_skill_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill selections" ON public.employee_skill_selections FOR SELECT USING (
  employee_service_id IN (SELECT id FROM employee_services WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can insert own skill selections" ON public.employee_skill_selections FOR INSERT WITH CHECK (
  employee_service_id IN (SELECT id FROM employee_services WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can delete own skill selections" ON public.employee_skill_selections FOR DELETE USING (
  employee_service_id IN (SELECT id FROM employee_services WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins can manage skill selections" ON public.employee_skill_selections FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to employee_skill_selections" ON public.employee_skill_selections FOR ALL USING (false) WITH CHECK (false);

-- 5. Work Experiences (multiple per employee)
CREATE TABLE public.work_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_type text NOT NULL DEFAULT 'private',
  work_description text,
  start_year integer NOT NULL,
  end_year integer,
  is_current boolean NOT NULL DEFAULT false,
  certificate_path text,
  certificate_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work experiences" ON public.work_experiences FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own work experiences" ON public.work_experiences FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own work experiences" ON public.work_experiences FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own work experiences" ON public.work_experiences FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage work experiences" ON public.work_experiences FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to work_experiences" ON public.work_experiences FOR ALL USING (false) WITH CHECK (false);

-- 6. Emergency Contacts (multiple per employee)
CREATE TABLE public.employee_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  relationship text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emergency contacts" ON public.employee_emergency_contacts FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own emergency contacts" ON public.employee_emergency_contacts FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own emergency contacts" ON public.employee_emergency_contacts FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own emergency contacts" ON public.employee_emergency_contacts FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage emergency contacts" ON public.employee_emergency_contacts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to employee_emergency_contacts" ON public.employee_emergency_contacts FOR ALL USING (false) WITH CHECK (false);

-- 7. App Settings (admin-configurable, e.g. countdown hours)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon write to app_settings" ON public.app_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default countdown setting
INSERT INTO public.app_settings (key, value) VALUES ('approval_countdown_hours', '6');

-- 8. Storage bucket for work certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('work-certificates', 'work-certificates', false);

CREATE POLICY "Users can upload own certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'work-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own certificates" ON storage.objects FOR SELECT USING (bucket_id = 'work-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all certificates" ON storage.objects FOR SELECT USING (bucket_id = 'work-certificates' AND public.has_role(auth.uid(), 'admin'));
