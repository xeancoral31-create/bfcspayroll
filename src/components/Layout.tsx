import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calculator, FileText, BarChart3, Menu, X, Landmark, Sun, Moon, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import bfcsLogo from "@/assets/bfcs-logo.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import NotificationDropdown from "@/components/NotificationDropdown";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },
  { to: "/employees", label: "Employees", icon: Users, section: "Management" },
  { to: "/payroll", label: "Run Payroll", icon: Calculator, section: "Management" },
  { to: "/payslips", label: "Payslips", icon: FileText, section: "Records" },
  { to: "/loans", label: "Loans", icon: Landmark, section: "Records" },
  { to: "/reports", label: "Reports", icon: BarChart3, section: "Records" },
];

const sections = ["Overview", "Management", "Records"];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [today, setToday] = useState(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  );
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const currentPage = navItems.find((n) => n.to === location.pathname);

  useEffect(() => {
    const update = () =>
      setToday(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-sidebar-border ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 px-5 py-5">
            <div className="relative">
              <img
                src={bfcsLogo}
                alt="BFCS Logo"
                className="h-11 w-11 rounded-xl bg-white/95 p-0.5 shadow-md ring-1 ring-white/10"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-sidebar-background" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-sidebar-accent-foreground leading-tight">
                BFCS Payroll
              </h1>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium tracking-wide">
                Management System
              </p>
            </div>
          </div>

          <Separator className="bg-sidebar-border mx-4" />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {sections.map((section) => {
              const items = navItems.filter((n) => n.section === section);
              return (
                <div key={section}>
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/30">
                    {section}
                  </p>
                  <ul className="space-y-0.5" role="list">
                    {items.map(({ to, label, icon: Icon }) => {
                      const isActive = location.pathname === to;
                      return (
                        <li key={to}>
                          <NavLink
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <Icon
                              className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                                isActive
                                  ? "text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground"
                              }`}
                            />
                            <span className="truncate">{label}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3 w-3 text-sidebar-foreground/30" />
              <p className="text-[10px] text-sidebar-foreground/40 font-semibold">
                Butuan Faith Christian School
              </p>
            </div>
            <p className="text-[9px] text-sidebar-foreground/25 pl-5">© 2026 BFCS Payroll System v2.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
            aria-label="Open navigation menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Page title & date */}
          <div className="flex flex-col">
            {currentPage && (
              <h2 className="text-sm font-bold text-foreground leading-tight">
                {currentPage.label}
              </h2>
            )}
            <p className="text-[10px] text-muted-foreground/70 hidden sm:block">{today}</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* System status */}
            <div className="hidden md:flex items-center gap-2 rounded-full bg-success/10 px-3.5 py-1.5 mr-2">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-semibold text-success">Online</span>
            </div>

            <NotificationDropdown />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="h-9 w-9 rounded-full"
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

            <Separator orientation="vertical" className="h-6 mx-1.5 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <img
                src={bfcsLogo}
                alt="BFCS"
                className="h-8 w-8 rounded-full ring-2 ring-border"
              />
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-foreground leading-tight">Administrator</p>
                <p className="text-[10px] text-muted-foreground">BFCS Finance</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-background">{children}</main>
      </div>
    </div>
  );
}
