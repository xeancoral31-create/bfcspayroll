import { useState } from "react";
import { useProducts, useCart, type CartItem } from "@/hooks/usePOS";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function POS() {
  const { data: products, isLoading } = useProducts();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const categories = products
    ? Array.from(new Set(products.map((p) => p.category || "General")))
    : [];

  const filtered = products?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async () => {
    const paid = parseFloat(amountPaid);
    if (paymentMethod === "cash" && (isNaN(paid) || paid < subtotal)) {
      toast.error("Insufficient amount paid.");
      return;
    }
    const finalPaid = paymentMethod === "cash" ? paid : subtotal;
    const change = paymentMethod === "cash" ? Math.max(0, paid - subtotal) : 0;

    setProcessing(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        items: cart as any,
        subtotal,
        total: subtotal,
        payment_method: paymentMethod,
        amount_paid: finalPaid,
        change_amount: change,
        status: "completed",
      });
      if (error) throw error;

      // Update stock
      for (const item of cart) {
        const product = products?.find((p) => p.id === item.id);
        if (product) {
          await supabase
            .from("products")
            .update({ stock: Math.max(0, product.stock - item.quantity) })
            .eq("id", item.id);
        }
      }

      clearCart();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      if (change > 0) {
        toast.success(`Done! Change: ₱${change.toFixed(2)}`);
      } else {
        toast.success("Transaction completed!");
      }
      setCheckoutOpen(false);
      setAmountPaid("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] gap-4 lg:gap-6">
      {/* Product Grid */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Search & Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered?.map((product) => (
                <button
                  key={product.id}
                  onClick={() =>
                    product.stock > 0
                      ? addToCart({ id: product.id, name: product.name, price: Number(product.price) })
                      : toast.error("Out of stock!")
                  }
                  className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:shadow-elevated hover:border-primary/30 active:scale-[0.97] disabled:opacity-50"
                  disabled={product.stock <= 0}
                >
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                    {product.name[0]}
                  </div>
                  <p className="text-sm font-semibold text-card-foreground line-clamp-1">{product.name}</p>
                  <p className="text-base font-bold text-primary mt-1">₱{Number(product.price).toFixed(2)}</p>
                  <Badge variant={product.stock > 10 ? "secondary" : "destructive"} className="mt-1.5 text-[10px]">
                    Stock: {product.stock}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <Card className="w-80 lg:w-96 flex flex-col shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{cart.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-4 pt-0">
          {cart.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Tap a product to add
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₱{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="w-16 text-right text-sm font-bold">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-auto pt-4">
              <Separator className="mb-3" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearCart} className="flex-1">
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
                <Button size="sm" onClick={() => { setCheckoutOpen(true); setAmountPaid(""); }} className="flex-[2]">
                  <CreditCard className="h-3 w-3 mr-1" /> Checkout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout — ₱{subtotal.toFixed(2)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="h-4 w-4 mr-2" /> Cash
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Card
              </Button>
            </div>
            {paymentMethod === "cash" && (
              <div>
                <label className="text-sm font-medium text-foreground">Amount Paid</label>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  autoFocus
                />
                {amountPaid && parseFloat(amountPaid) >= subtotal && (
                  <p className="mt-2 text-sm font-semibold text-accent">
                    Change: ₱{(parseFloat(amountPaid) - subtotal).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Quick amounts */}
            {paymentMethod === "cash" && (
              <div className="flex flex-wrap gap-2">
                {[20, 50, 100, 200, 500, 1000].map((amt) => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setAmountPaid(String(amt))}>
                    ₱{amt}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setAmountPaid(String(subtotal))}>
                  Exact
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckout} disabled={processing}>
              {processing ? "Processing..." : "Complete Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
