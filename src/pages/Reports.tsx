import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(225, 75%, 45%)", "hsl(0, 78%, 52%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 50%)"];

export default function Reports() {
  const { data: employees } = useEmployees();
  const { data: records } = usePayrollRecords();

  // Monthly expense
  const monthlyExpense = records?.reduce((acc: Record<string, { gross: number; deductions: number; net: number }>, r) => {
    const month = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!acc[month]) acc[month] = { gross: 0, deductions: 0, net: 0 };
    acc[month].gross += Number(r.gross_pay);
    acc[month].deductions += Number(r.total_deductions);
    acc[month].net += Number(r.net_pay);
    return acc;
  }, {} as Record<string, any>);
  const monthlyData = Object.entries(monthlyExpense || {}).map(([month, v]) => ({ month, ...v })).slice(-6);

  // Department breakdown
  const deptExpense = records?.reduce((acc: Record<string, number>, r: any) => {
    const dept = r.employees?.department || "Unknown";
    acc[dept] = (acc[dept] || 0) + Number(r.net_pay);
    return acc;
  }, {} as Record<string, number>);
  const deptData = Object.entries(deptExpense || {}).map(([name, value]) => ({ name, value }));

  // Top earners
  const earnerMap = records?.reduce((acc: Record<string, { name: string; total: number }>, r: any) => {
    const key = r.employee_id;
    const name = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`;
    if (!acc[key]) acc[key] = { name, total: 0 };
    acc[key].total += Number(r.net_pay);
    return acc;
  }, {} as Record<string, any>);
  const topEarners = Object.values(earnerMap || {}).sort((a: any, b: any) => b.total - a.total).slice(0, 5);

  const totalActive = employees?.filter((e) => e.status === "active").length || 0;
  const totalDisbursed = records?.reduce((s, r) => s + Number(r.net_pay), 0) || 0;
  const totalRecords = records?.length || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">Payroll Reports</h1>
          <p className="text-xs text-muted-foreground">Analytics & summaries for BFCS cashier payroll</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Active Employees</p>
            <p className="text-2xl font-extrabold text-foreground">{totalActive}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Disbursed</p>
            <p className="text-2xl font-extrabold text-success">₱{totalDisbursed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Payroll Records</p>
            <p className="text-2xl font-extrabold text-foreground">{totalRecords}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Monthly Payroll Trend</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, ""]} />
                  <Line type="monotone" dataKey="gross" stroke="hsl(225, 75%, 45%)" strokeWidth={2} name="Gross" />
                  <Line type="monotone" dataKey="net" stroke="hsl(152, 60%, 40%)" strokeWidth={2} name="Net" />
                  <Line type="monotone" dataKey="deductions" stroke="hsl(0, 78%, 52%)" strokeWidth={2} name="Deductions" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Expense by Department</h3>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Earners */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-card-foreground mb-4">Top Earners (Cumulative)</h3>
          {topEarners.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topEarners} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Total"]} />
                <Bar dataKey="total" fill="hsl(225, 75%, 45%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
