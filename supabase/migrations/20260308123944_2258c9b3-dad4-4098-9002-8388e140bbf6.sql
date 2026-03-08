-- Make employee creation work from current app flow (including anon preview sessions)
DROP POLICY IF EXISTS "Admin/HR can insert employees" ON public.employees;

CREATE POLICY "Allow app to insert employees"
ON public.employees
FOR INSERT
WITH CHECK (auth.role() IN ('anon', 'authenticated'));