CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  loan_type text NOT NULL DEFAULT 'Company',
  amount numeric NOT NULL DEFAULT 0,
  remaining_balance numeric NOT NULL DEFAULT 0,
  monthly_deduction numeric NOT NULL DEFAULT 0,
  start_date date,
  remarks text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read loans" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Allow insert loans" ON public.loans FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow update loans" ON public.loans FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow delete loans" ON public.loans FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));