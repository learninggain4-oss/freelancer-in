
-- =============================================
-- Phase 6: Core Database Schema
-- =============================================

-- 1. Project status enum
CREATE TYPE public.project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');

-- 2. Application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit', 'hold', 'release');

-- 4. Withdrawal status enum
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requirements TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  validation_fees NUMERIC NOT NULL DEFAULT 0,
  remarks TEXT,
  start_date DATE,
  end_date DATE,
  status public.project_status NOT NULL DEFAULT 'open',
  assigned_employee_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Clients can view their own projects
CREATE POLICY "Clients can view own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Employees can view open projects or projects assigned to them
CREATE POLICY "Employees can view available projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR assigned_employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Clients can create projects
CREATE POLICY "Clients can insert projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Clients can update their own projects
CREATE POLICY "Clients can update own projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Admins full access
CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PROJECT APPLICATIONS TABLE
-- =============================================
CREATE TABLE public.project_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(project_id, employee_id)
);

ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;

-- Employees can view their own applications
CREATE POLICY "Employees can view own applications" ON public.project_applications
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Clients can view applications for their projects
CREATE POLICY "Clients can view project applications" ON public.project_applications
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- Employees can apply (insert)
CREATE POLICY "Employees can apply to projects" ON public.project_applications
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Clients can update application status
CREATE POLICY "Clients can update applications" ON public.project_applications
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- Admins full access
CREATE POLICY "Admins can manage applications" ON public.project_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Only system/admin can insert transactions (via edge functions or admin)
CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- WITHDRAWALS TABLE
-- =============================================
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL DEFAULT 'UPI',
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Employees can view their own withdrawals
CREATE POLICY "Employees can view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Employees can request withdrawals
CREATE POLICY "Employees can request withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Clients can view withdrawals (for approval)
CREATE POLICY "Clients can view withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (true);

-- Clients can update withdrawal status
CREATE POLICY "Clients can update withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated
  USING (true);

-- Admins full access
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PROJECT SUBMISSIONS TABLE
-- =============================================
CREATE TABLE public.project_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT,
  file_name TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Employees can view their own submissions
CREATE POLICY "Employees can view own submissions" ON public.project_submissions
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Employees can submit
CREATE POLICY "Employees can create submissions" ON public.project_submissions
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Clients can view submissions for their projects
CREATE POLICY "Clients can view project submissions" ON public.project_submissions
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- Admins full access
CREATE POLICY "Admins can manage submissions" ON public.project_submissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Deny anonymous access to all new tables
-- =============================================
CREATE POLICY "Deny anon access to projects" ON public.projects FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon access to applications" ON public.project_applications FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon access to transactions" ON public.transactions FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon access to withdrawals" ON public.withdrawals FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon access to submissions" ON public.project_submissions FOR ALL TO anon USING (false) WITH CHECK (false);
