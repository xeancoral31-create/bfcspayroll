
-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  category text DEFAULT 'General',
  image_url text,
  stock integer NOT NULL DEFAULT 0,
  barcode text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  amount_paid numeric NOT NULL DEFAULT 0,
  change_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Disable RLS for public cashier access (no auth)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Seed some sample products
INSERT INTO public.products (name, price, category, stock) VALUES
  ('Coffee', 50, 'Beverages', 100),
  ('Tea', 35, 'Beverages', 100),
  ('Sandwich', 85, 'Food', 50),
  ('Burger', 120, 'Food', 40),
  ('Juice', 45, 'Beverages', 80),
  ('Fries', 55, 'Food', 60),
  ('Water', 20, 'Beverages', 200),
  ('Salad', 95, 'Food', 30),
  ('Ice Cream', 40, 'Desserts', 50),
  ('Cake Slice', 75, 'Desserts', 25),
  ('Rice Meal', 99, 'Food', 45),
  ('Soda', 30, 'Beverages', 150);
