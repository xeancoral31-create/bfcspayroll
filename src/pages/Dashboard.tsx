import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Landmark, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import bfcsLogo from "@/assets/bfcs-logo.png";

export default function Dashboard() {
  const { data: employees } = useEmployees();
  const { data: records } = usePayrollRecords();

  const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
  const totalPayroll = records?.reduce((s, r) => s + Number(r.net_pay), 0) || 0;
  const avgSalary = activeEmployees > 0 ? (employees?.reduce((s, e) => s + Number(e.basic_salary), 0) || 0) / activeEmployees : 0;
  const thisMonth = records?.filter(
    (r) => new Date(r.created_at).getMonth() === new Date().getMonth()
  ).length || 0;

  const departmentData = employees?.reduce((acc: Record<string, number>, emp) => {
    const dept = emp.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deptChartData = Object.entries(departmentData || {}).map(([name, value]) => ({ name, value }));
  const COLORS = ["hsl(225, 75%, 45%)", "hsl(0, 78%, 52%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 50%)"];

  const recentPayroll = records?.slice(0, 5) || [];

  // Monthly payroll summary
  const monthlyData = records?.reduce((acc: Record<string, number>, r) => {
    const month = new Date(r.created_at).toLocaleDateString("en-US", { month: "short" });
    acc[month] = (acc[month] || 0) + Number(r.net_pay);
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.entries(monthlyData || {}).map(([month, amount]) => ({ month, amount })).slice(-6);

  const stats = [
    {
      label: "Active Staff",
      value: activeEmployees,
      icon: Users,
      change: "+2 this month",
      trend: "up" as const,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Total Disbursed",
      value: `₱${totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: "All time",
      trend: "up" as const,
      color: "bg-success/10 text-success",
    },
    {
      label: "Avg. Salary",
      value: `₱${avgSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      change: "Per employee",
      trend: "neutral" as const,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "This Month",
      value: `${thisMonth} processed`,
      icon: Calendar,
      change: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      trend: "up" as const,
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative z-10 flex items-center gap-5">
          <img src={bfcsLogo} alt="BFCS Logo" className="h-16 w-16 rounded-full bg-white p-1 shadow-lg" />
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              Butuan Faith Christian School
            </h1>
            <p className="text-white/70 text-sm font-medium mt-0.5">
              Cashier Staff Payroll Management System
            </p>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="group hover:shadow-elevated transition-all duration-300 border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                {stat.trend === "up" && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-success">
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-extrabold text-card-foreground tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Monthly Payroll Disbursements</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="amount" fill="hsl(225, 75%, 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No payroll data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Staff by Department</h3>
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={deptChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {deptChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No departments yet</div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {deptChartData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Activity */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-card-foreground mb-4">Recent Payroll Activity</h3>
          {recentPayroll.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payroll records yet. Go to "Run Payroll" to process your first payroll.</p>
          ) : (
            <div className="space-y-2">
              {recentPayroll.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.employees?.first_name} {r.employees?.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.period} · {r.employees?.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-success">₱{Number(r.net_pay).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">{r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
