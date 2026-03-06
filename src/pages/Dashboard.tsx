import { Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const fmt = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

export default function Dashboard() {
  const { employees } = useEmployees();
  const { records } = usePayrollRecords();

  const activeEmployees = employees.filter((e) => e.status === "active");
  const totalGross = records.reduce((s, r) => s + r.grossPay, 0);
  const totalNet = records.reduce((s, r) => s + r.netPay, 0);
  const pendingCount = records.filter((r) => r.status === "processed").length;

  const stats = [
    { label: "Active Employees", value: activeEmployees.length, icon: Users, color: "text-primary" },
    { label: "Total Gross Pay", value: fmt(totalGross), icon: DollarSign, color: "text-accent" },
    { label: "Total Net Pay", value: fmt(totalNet), icon: TrendingUp, color: "text-success" },
    { label: "Pending Payslips", value: pendingCount, icon: Clock, color: "text-warning" },
  ];

  const recentRecords = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of payroll operations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Recent Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payroll records yet. Go to "Run Payroll" to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employee.firstName} {r.employee.lastName}</TableCell>
                      <TableCell>{r.period}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(r.netPay)}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "paid" ? "default" : "secondary"} className={r.status === "paid" ? "bg-success text-success-foreground" : ""}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeEmployees.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {e.firstName[0]}{e.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.firstName} {e.lastName}</p>
                      <p className="text-xs text-muted-foreground">{e.position}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm text-foreground">{fmt(e.basicSalary)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
