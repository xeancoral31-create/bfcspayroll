import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Landmark, ArrowUpRight, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import bfcsLogo from "@/assets/bfcs-logo.png";

// Color-blind safe palette: blue, orange, teal, gold, purple
const CB_COLORS = [
  "hsl(220, 70%, 42%)",
  "hsl(28, 85%, 52%)",
  "hsl(198, 65%, 38%)",
  "hsl(38, 88%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(180, 50%, 40%)",
];

export default function Dashboard() {
  const { data: employees } = useEmployees();
  const { data: records } = usePayrollRecords();
  const { data: loans } = useLoans();

  const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
  const totalPayroll = records?.reduce((s, r) => s + Number(r.net_pay), 0) || 0;
  const avgSalary = activeEmployees > 0 ? (employees?.reduce((s, e) => s + Number(e.basic_salary), 0) || 0) / activeEmployees : 0;

  const activeLoans = (loans || []).filter((l: any) => l.status === "active");
  const totalLoanBalance = activeLoans.reduce((s: number, l: any) => s + Number(l.remaining_balance), 0);

  const departmentData = employees?.reduce((acc: Record<string, number>, emp) => {
    const dept = emp.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deptChartData = Object.entries(departmentData || {}).map(([name, value]) => ({ name, value }));

  const recentPayroll = records?.slice(0, 5) || [];

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
      sub: `of ${employees?.length || 0} total`,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Disbursed",
      value: `₱${totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      sub: "All time net pay",
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: "Avg. Salary",
      value: `₱${avgSalary.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      sub: "Per active employee",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      label: "Active Loans",
      value: `${activeLoans.length}`,
      icon: Landmark,
      sub: `₱${totalLoanBalance.toLocaleString()} outstanding`,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden rounded-xl p-6 lg:p-8"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-10 flex items-center gap-5">
          <img
            src={bfcsLogo}
            alt="BFCS Logo"
            className="h-14 w-14 rounded-xl bg-white/90 p-1 shadow-md"
          />
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Butuan Faith Christian School
            </h1>
            <p className="text-white/70 text-sm font-medium mt-0.5">
              Payroll Management System — Dashboard Overview
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="group hover:shadow-elevated transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2.5 ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-card-foreground tracking-tight font-mono">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">
              Monthly Payroll Disbursements
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(220, 14%, 89%)",
                      boxShadow: "0 4px 12px hsl(222, 28%, 14%, 0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(220, 70%, 42%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                No payroll data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Staff by Department</h3>
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={deptChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptChartData.map((_, i) => (
                      <Cell key={i} fill={CB_COLORS[i % CB_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(220, 14%, 89%)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                No departments yet
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
              {deptChartData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                    style={{ background: CB_COLORS[i % CB_COLORS.length] }}
                  />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Activity */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Recent Payroll Activity</h3>
          {recentPayroll.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No payroll records yet. Go to "Run Payroll" to process your first payroll.
            </p>
          ) : (
            <div className="space-y-2">
              {recentPayroll.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {r.employees?.first_name} {r.employees?.last_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.period} · {r.employees?.position}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-primary">
                      ₱{Number(r.net_pay).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {r.status}
                    </p>
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
