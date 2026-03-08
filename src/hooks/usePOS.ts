import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const queryClient = useQueryClient();

  const addToCart = useCallback((product: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
    }
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkout = useMutation({
    mutationFn: async ({ paymentMethod, amountPaid }: { paymentMethod: string; amountPaid: number }) => {
      const total = subtotal;
      const changeAmount = amountPaid - total;

      const { error } = await supabase.from("transactions").insert({
        items: cart as any,
        subtotal: total,
        total,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        change_amount: Math.max(0, changeAmount),
        status: "completed",
      });
      if (error) throw error;

      // Decrease stock
      for (const item of cart) {
        await supabase.rpc("has_role" as any); // placeholder - we'll update stock directly
        await supabase
          .from("products")
          .update({ stock: undefined as any }) // will handle below
          .eq("id", item.id);
      }
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction completed!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { cart, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, checkout };
}
