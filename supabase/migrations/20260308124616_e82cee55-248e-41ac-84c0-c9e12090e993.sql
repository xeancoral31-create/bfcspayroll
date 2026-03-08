-- Allow update and delete for app users
DROP POLICY IF EXISTS "Admin/HR can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admin can delete employees" ON public.employees;

CREATE POLICY "Allow app to update employees"
ON public.employees FOR UPDATE
USING (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "Allow app to delete employees"
ON public.employees FOR DELETE
USING (auth.role() IN ('anon', 'authenticated'));