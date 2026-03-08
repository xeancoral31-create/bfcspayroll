
-- Fix payroll_records policies: drop restrictive, create permissive
DROP POLICY IF EXISTS "Allow app to delete payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Allow app to insert payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Allow app to update payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Allow read payroll" ON public.payroll_records;

CREATE POLICY "Allow read payroll" ON public.payroll_records FOR SELECT USING (true);
CREATE POLICY "Allow insert payroll" ON public.payroll_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update payroll" ON public.payroll_records FOR UPDATE USING (true);
CREATE POLICY "Allow delete payroll" ON public.payroll_records FOR DELETE USING (true);

-- Fix employees policies
DROP POLICY IF EXISTS "Allow app to delete employees" ON public.employees;
DROP POLICY IF EXISTS "Allow app to insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow app to update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;

CREATE POLICY "Allow read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow delete employees" ON public.employees FOR DELETE USING (true);

-- Fix loans policies
DROP POLICY IF EXISTS "Allow delete loans" ON public.loans;
DROP POLICY IF EXISTS "Allow insert loans" ON public.loans;
DROP POLICY IF EXISTS "Allow read loans" ON public.loans;
DROP POLICY IF EXISTS "Allow update loans" ON public.loans;

CREATE POLICY "Allow read loans" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Allow insert loans" ON public.loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update loans" ON public.loans FOR UPDATE USING (true);
CREATE POLICY "Allow delete loans" ON public.loans FOR DELETE USING (true);
