
-- Drop existing restrictive policies on employees
DROP POLICY IF EXISTS "Admin can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Admin/HR can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admin/HR can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can view employees"
  ON public.employees FOR SELECT
  USING (true);

CREATE POLICY "Admin/HR can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Admin/HR can update employees"
  ON public.employees FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Admin can delete employees"
  ON public.employees FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
