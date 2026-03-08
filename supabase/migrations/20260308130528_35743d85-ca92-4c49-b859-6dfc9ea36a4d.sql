
-- Fix payroll_records RLS to allow anon access (matching other tables)
DROP POLICY IF EXISTS "Admin can delete payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admin/HR can insert payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admin/HR can update payroll" ON public.payroll_records;

CREATE POLICY "Allow app to insert payroll" ON public.payroll_records FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow app to update payroll" ON public.payroll_records FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow app to delete payroll" ON public.payroll_records FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));
