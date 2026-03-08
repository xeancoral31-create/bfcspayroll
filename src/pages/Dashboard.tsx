import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, Landmark, ArrowUpRight, Calendar, Activity, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
  const inactiveEmployees = (employees?.length || 0) - activeEmployees;
  const totalPayroll = records?.reduce((s, r) => s + Number(r.net_pay), 0) || 0;
  const totalGross = records?.reduce((s, r) => s + Number(r.gross_pay), 0) || 0;
  const avgSalary = activeEmployees > 0 ? (employees?.reduce((s, e) => s + Number(e.basic_salary), 0) || 0) / activeEmployees : 0;

  const activeLoans = (loans || []).filter((l: any) => l.status === "active");
  const totalLoanBalance = activeLoans.reduce((s: number, l: any) => s + Number(l.remaining_balance), 0);

  const departmentData = employees?.reduce((acc: Record<string, number>, emp) => {
    const dept = emp.department || emp.position || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const deptChartData = Object.entries(departmentData || {}).map(([name, value]) => ({ name, value }));

  const recentPayroll = records?.slice(0, 6) || [];

  const monthlyData = records?.reduce((acc: Record<string, { gross: number; net: number }>, r) => {
    const month = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!acc[month]) acc[month] = { gross: 0, net: 0 };
    acc[month].gross += Number(r.gross_pay);
    acc[month].net += Number(r.net_pay);
    return acc;
  }, {} as Record<string, any>);
  const barData = Object.entries(monthlyData || {}).map(([month, v]) => ({ month, ...(v as any) })).slice(-6);

  const stats = [
    {
      label: "Active Employees",
      value: activeEmployees,
      icon: Users,
      sub: `${inactiveEmployees} inactive`,
      color: "text-primary",
      bg: "bg-primary/8",
      border: "border-primary/15",
    },
    {
      label: "Total Net Disbursed",
      value: `₱${totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      sub: `₱${totalGross.toLocaleString()} gross`,
      color: "text-success",
      bg: "bg-success/8",
      border: "border-success/15",
    },
    {
      label: "Average Basic Salary",
      value: `₱${avgSalary.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      sub: "Per active employee",
      color: "text-warning",
      bg: "bg-warning/8",
      border: "border-warning/15",
    },
    {
      label: "Outstanding Loans",
      value: `₱${totalLoanBalance.toLocaleString()}`,
      icon: Landmark,
      sub: `${activeLoans.length} active loans`,
      color: "text-accent",
      bg: "bg-accent/8",
      border: "border-accent/15",
    },
  ];

  const tooltipStyle = {
    borderRadius: "10px",
    border: "1px solid hsl(220, 14%, 89%)",
    boxShadow: "0 8px 24px hsl(222, 28%, 14%, 0.08)",
    fontSize: "12px",
    fontFamily: "'IBM Plex Sans', sans-serif",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor your payroll operations and workforce at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold" onClick={() => navigate("/reports")}>
            <BarChart3 className="h-3.5 w-3.5" /> View Reports
          </Button>
          <Button size="sm" className="gap-2 text-xs font-semibold" onClick={() => navigate("/payroll")}>
            <Activity className="h-3.5 w-3.5" /> Run Payroll
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`border ${stat.border} hover:shadow-lg transition-all duration-300`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30" />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight font-mono">
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-muted-foreground mt-1.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-6 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Monthly Payroll Trend</CardTitle>
              <Badge variant="secondary" className="text-[10px] font-semibold">Last 6 months</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} barCategoryGap="20%">
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number, name: string) => [`₱${v.toLocaleString()}`, name === "gross" ? "Gross Pay" : "Net Pay"]} contentStyle={tooltipStyle} />
                  <Bar dataKey="gross" fill="hsl(220, 70%, 42%)" radius={[6, 6, 0, 0]} name="gross" opacity={0.3} />
                  <Bar dataKey="net" fill="hsl(220, 70%, 42%)" radius={[6, 6, 0, 0]} name="net" />
                  <Legend formatter={(v) => v === "gross" ? "Gross Pay" : "Net Pay"} wrapperStyle={{ fontSize: "11px" }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                <Calendar className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">No payroll data yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Process your first payroll to see trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-6 pt-5">
            <CardTitle className="text-sm font-bold">Staff Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {deptChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={deptChartData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                      {deptChartData.map((_, i) => (
                        <Cell key={i} fill={CB_COLORS[i % CB_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-3">
                  {deptChartData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: CB_COLORS[i % CB_COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold font-mono text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                <Users className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">No staff data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3 px-6 pt-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Recent Payroll Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold gap-1" onClick={() => navigate("/payslips")}>
              View All <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {recentPayroll.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 text-muted-foreground/20" />
              <p className="text-sm font-medium">No payroll records yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Process a payroll to see activity here</p>
              <Button size="sm" className="mt-4 text-xs font-semibold" onClick={() => navigate("/payroll")}>
                Run First Payroll
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayroll.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3.5 rounded-xl border bg-card p-3.5 hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate("/payslips")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                    {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {r.employees?.first_name} {r.employees?.last_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.period} · {r.employees?.position || "Staff"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-mono text-primary">
                      ₱{Number(r.net_pay).toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="text-[9px] font-semibold uppercase mt-0.5">
                      <span className="h-1 w-1 rounded-full bg-success mr-1" />
                      {r.status}
                    </Badge>
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

// Re-export BarChart3 for use
import { BarChart3 } from "lucide-react";
