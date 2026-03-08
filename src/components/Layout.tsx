import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calculator, FileText, BarChart3, Menu, X, Landmark } from "lucide-react";
import { useState } from "react";
import bfcsLogo from "@/assets/bfcs-logo.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/payroll", label: "Run Payroll", icon: Calculator },
  { to: "/payslips", label: "Payslips", icon: FileText },
  { to: "/loans", label: "Loans", icon: Landmark },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
            <img src={bfcsLogo} alt="BFCS Logo" className="h-11 w-11 rounded-full bg-white p-0.5 shadow-md" />
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-sidebar-accent-foreground leading-tight">BFCS Payroll</h1>
              <p className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-widest">Cashier System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 px-3 py-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Menu</p>
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-sidebar-primary/15 text-sidebar-primary shadow-sm border border-sidebar-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground border border-transparent"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"}`} />
                  {label}
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-5 py-4">
            <p className="text-[10px] text-sidebar-foreground/40 font-medium">Butuan Faith Christian School</p>
            <p className="text-[10px] text-sidebar-foreground/30">© 2026 BFCS Payroll v1.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">
              {navItems.find((n) => n.to === location.pathname)?.label ?? "BFCS Payroll"}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <img src={bfcsLogo} alt="BFCS" className="h-7 w-7 rounded-full opacity-60 lg:hidden" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
