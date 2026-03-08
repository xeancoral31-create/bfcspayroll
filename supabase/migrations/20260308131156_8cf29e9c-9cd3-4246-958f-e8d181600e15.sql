
-- Fix payroll_records SELECT policy - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can view payroll" ON public.payroll_records;
CREATE POLICY "Allow read payroll" ON public.payroll_records FOR SELECT USING (true);
