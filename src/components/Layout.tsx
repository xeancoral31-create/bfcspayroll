import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calculator, FileText, BarChart3, Menu, X, Landmark, ChevronRight, Sun, Moon } from "lucide-react";
import { useState } from "react";
import bfcsLogo from "@/assets/bfcs-logo.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

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
  const { theme, toggle } = useTheme();

  const currentPage = navItems.find((n) => n.to === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
            <img
              src={bfcsLogo}
              alt="BFCS Logo"
              className="h-10 w-10 rounded-lg bg-white/90 p-0.5 shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold tracking-tight text-sidebar-accent-foreground leading-tight">
                BFCS Payroll
              </h1>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium uppercase tracking-[0.12em]">
                Management System
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/35">
              Navigation
            </p>
            <ul className="space-y-0.5" role="list">
              {navItems.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-sidebar-primary/15 text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                        }`}
                      />
                      <span className="truncate">{label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-sidebar-primary opacity-60" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-5 py-4">
            <p className="text-[10px] text-sidebar-foreground/35 font-medium leading-relaxed">
              Butuan Faith Christian School
            </p>
            <p className="text-[10px] text-sidebar-foreground/25">© 2026 BFCS Payroll v1.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
            aria-label="Open navigation menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Breadcrumb-style header */}
          <div className="flex items-center gap-2">
            {currentPage && (
              <>
                <currentPage.icon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {currentPage.label}
                </h2>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-medium text-muted-foreground">System Online</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="h-9 w-9"
                  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === "light" ? "Dark mode" : "Light mode"}
              </TooltipContent>
            </Tooltip>
            <img
              src={bfcsLogo}
              alt="BFCS"
              className="h-7 w-7 rounded-lg opacity-50 lg:hidden"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
