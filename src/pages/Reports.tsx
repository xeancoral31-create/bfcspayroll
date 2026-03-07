import { useMemo } from "react";
import { useSupabasePayrollRecords, useSupabaseEmployees } from "@/hooks/useSupabasePayroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const fmt = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const COLORS = [
  "hsl(199, 89%, 38%)",
  "hsl(168, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(215, 30%, 50%)",
];

export default function Reports() {
  const { records, loading: recLoading } = useSupabasePayrollRecords();
  const { employees, loading: empLoading } = useSupabaseEmployees();

  const loading = recLoading || empLoading;

  const monthlyData = useMemo(() => {
    const map = new Map<string, { gross: number; deductions: number; net: number }>();
    for (const r of records) {
      const existing = map.get(r.period) || { gross: 0, deductions: 0, net: 0 };
      existing.gross += Number(r.gross_pay);
      existing.deductions += Number(r.total_deductions);
      existing.net += Number(r.net_pay);
      map.set(r.period, existing);
    }
    return Array.from(map.entries()).map(([period, data]) => ({ period, ...data }));
  }, [records]);

  const departmentData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const dept = r.employees?.department ?? "Unknown";
      map.set(dept, (map.get(dept) || 0) + Number(r.net_pay));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [records]);

  const trendData = useMemo(() => {
    let cumulative = 0;
    return monthlyData.map((d) => {
      cumulative += d.net;
      return { period: d.period, netPay: d.net, cumulative };
    });
  }, [monthlyData]);

  const totalGross = records.reduce((s, r) => s + Number(r.gross_pay), 0);
  const totalDeductions = records.reduce((s, r) => s + Number(r.total_deductions), 0);
  const totalNet = records.reduce((s, r) => s + Number(r.net_pay), 0);
  const activeCount = employees.filter((e) => e.status === "active").length;
  const avgNetPerEmployee = activeCount > 0 ? totalNet / activeCount : 0;

  const stats = [
    { label: "Total Gross Pay", value: fmt(totalGross) },
    { label: "Total Deductions", value: fmt(totalDeductions) },
    { label: "Total Net Pay", value: fmt(totalNet) },
    { label: "Avg Net / Employee", value: fmt(avgNetPerEmployee) },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">Payroll Reports</h1></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payroll Reports</h1>
        <p className="text-sm text-muted-foreground">Analytics and insights from payroll data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {records.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No payroll records yet. Process payroll first to see reports.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Monthly Expenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                  <Bar dataKey="gross" name="Gross Pay" fill="hsl(199, 89%, 38%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deductions" name="Deductions" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net Pay" fill="hsl(168, 60%, 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Department Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {departmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Net Pay Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="netPay" name="Net Pay" stroke="hsl(199, 89%, 38%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="hsl(168, 60%, 42%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
