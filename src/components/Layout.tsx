import { NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, Package, Receipt, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Cashier", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Package },
  { to: "/transactions", label: "Transactions", icon: Receipt },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-accent-foreground">CashierPOS</h1>
              <p className="text-xs text-sidebar-foreground/60">Point of Sale</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border px-4 py-4">
            <p className="text-xs text-sidebar-foreground/50">© 2026 CashierPOS</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {navItems.find((n) => n.to === location.pathname)?.label ?? "CashierPOS"}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
