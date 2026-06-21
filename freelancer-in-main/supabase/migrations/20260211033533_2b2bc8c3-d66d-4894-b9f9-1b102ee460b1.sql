
-- Fix overly permissive withdrawal policies
-- Drop the permissive policies
DROP POLICY "Clients can view withdrawals" ON public.withdrawals;
DROP POLICY "Clients can update withdrawals" ON public.withdrawals;

-- Clients can only view withdrawals from employees who worked on their projects
CREATE POLICY "Clients can view related withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT pa.employee_id FROM public.project_applications pa
      JOIN public.projects p ON p.id = pa.project_id
      WHERE p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND pa.status = 'approved'
    )
  );

-- Clients can update withdrawals for employees assigned to their projects
CREATE POLICY "Clients can update related withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated
  USING (
    employee_id IN (
      SELECT pa.employee_id FROM public.project_applications pa
      JOIN public.projects p ON p.id = pa.project_id
      WHERE p.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND pa.status = 'approved'
    )
  );
