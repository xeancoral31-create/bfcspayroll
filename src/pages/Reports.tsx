import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Landmark, DollarSign, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

const COLORS = ["hsl(225, 75%, 45%)", "hsl(0, 78%, 52%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 50%)", "hsl(190, 70%, 45%)"];

export default function Reports() {
  const { data: employees } = useEmployees();
  const { data: records } = usePayrollRecords();
  const { data: loans } = useLoans();

  // Monthly expense trend
  const monthlyExpense = records?.reduce((acc: Record<string, { gross: number; deductions: number; net: number; loanDed: number; govtDed: number }>, r) => {
    const month = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!acc[month]) acc[month] = { gross: 0, deductions: 0, net: 0, loanDed: 0, govtDed: 0 };
    const ded = typeof r.deductions === "object" ? (r.deductions as any) : {};
    acc[month].gross += Number(r.gross_pay);
    acc[month].deductions += Number(r.total_deductions);
    acc[month].net += Number(r.net_pay);
    acc[month].loanDed += Number(ded.loans || 0);
    acc[month].govtDed += (Number(ded.sss || 0) + Number(ded.philhealth || 0) + Number(ded.pagibig || 0) + Number(ded.withholding_tax || 0));
    return acc;
  }, {} as Record<string, any>);
  const monthlyData = Object.entries(monthlyExpense || {}).map(([month, v]) => ({ month, ...v })).slice(-12);

  // Deductions breakdown (aggregate)
  const deductionTotals = records?.reduce((acc: Record<string, number>, r) => {
    const ded = typeof r.deductions === "object" ? (r.deductions as any) : {};
    acc.sss = (acc.sss || 0) + Number(ded.sss || 0);
    acc.philhealth = (acc.philhealth || 0) + Number(ded.philhealth || 0);
    acc.pagibig = (acc.pagibig || 0) + Number(ded.pagibig || 0);
    acc.tax = (acc.tax || 0) + Number(ded.withholding_tax || 0);
    acc.loans = (acc.loans || 0) + Number(ded.loans || 0);
    acc.other = (acc.other || 0) + Number(ded.other || 0);
    return acc;
  }, {} as Record<string, number>);

  const deductionPieData = [
    { name: "SSS", value: deductionTotals?.sss || 0 },
    { name: "PhilHealth", value: deductionTotals?.philhealth || 0 },
    { name: "Pag-IBIG", value: deductionTotals?.pagibig || 0 },
    { name: "Tax", value: deductionTotals?.tax || 0 },
    { name: "Loans", value: deductionTotals?.loans || 0 },
    { name: "Other", value: deductionTotals?.other || 0 },
  ].filter((d) => d.value > 0);

  // Loan statistics
  const activeLoans = (loans || []).filter((l: any) => l.status === "active");
  const paidLoans = (loans || []).filter((l: any) => l.status === "paid");
  const totalLoanAmount = (loans || []).reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalRemaining = activeLoans.reduce((s: number, l: any) => s + Number(l.remaining_balance), 0);
  const totalCollected = totalLoanAmount - totalRemaining;

  // Loans by type
  const loansByType = (loans || []).reduce((acc: Record<string, { count: number; amount: number; remaining: number }>, l: any) => {
    const type = l.loan_type || "Other";
    if (!acc[type]) acc[type] = { count: 0, amount: 0, remaining: 0 };
    acc[type].count++;
    acc[type].amount += Number(l.amount);
    acc[type].remaining += Number(l.remaining_balance);
    return acc;
  }, {} as Record<string, any>);
  const loanTypeData = Object.entries(loansByType).map(([name, v]) => {
    const val = v as { count: number; amount: number; remaining: number };
    return { name, count: val.count, amount: val.amount, remaining: val.remaining };
  });

  // Department expense
  const deptExpense = records?.reduce((acc: Record<string, number>, r: any) => {
    const dept = r.employees?.position || "Unknown";
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
  const totalDeductions = records?.reduce((s, r) => s + Number(r.total_deductions), 0) || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">Payroll Reports</h1>
          <p className="text-xs text-muted-foreground">Analytics & summaries for BFCS payroll</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground font-medium">Total Disbursed</p>
            </div>
            <p className="text-2xl font-extrabold text-success">₱{totalDisbursed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground font-medium">Total Deductions</p>
            </div>
            <p className="text-2xl font-extrabold text-destructive">₱{totalDeductions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Active Loans</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{activeLoans.length}</p>
            <p className="text-[10px] text-muted-foreground">₱{totalRemaining.toLocaleString()} outstanding</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Payroll Records</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{records?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">{totalActive} active employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Payroll Trend */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-card-foreground mb-4">Monthly Payroll Expenses</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [`₱${v.toLocaleString()}`, name]} />
                <Area type="monotone" dataKey="gross" stroke="hsl(225, 75%, 45%)" fill="hsl(225, 75%, 45%)" fillOpacity={0.1} strokeWidth={2} name="Gross Pay" />
                <Area type="monotone" dataKey="net" stroke="hsl(152, 60%, 40%)" fill="hsl(152, 60%, 40%)" fillOpacity={0.1} strokeWidth={2} name="Net Pay" />
                <Area type="monotone" dataKey="deductions" stroke="hsl(0, 78%, 52%)" fill="hsl(0, 78%, 52%)" fillOpacity={0.05} strokeWidth={2} name="Total Deductions" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">No payroll data yet</div>
          )}
        </CardContent>
      </Card>

      {/* Deductions Breakdown + Loan Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deductions Pie */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Deductions Breakdown</h3>
            {deductionPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={deductionPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deductionPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deductionPieData.map((d, i) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name}: ₱{d.value.toLocaleString()}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No deductions data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Loan Statistics */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Loan Statistics</h3>
            {(loans || []).length > 0 ? (
              <div className="space-y-4">
                {/* Loan summary metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3 border border-border/50 text-center">
                    <p className="text-lg font-extrabold text-foreground">{(loans || []).length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Total Loans</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 border border-border/50 text-center">
                    <p className="text-lg font-extrabold text-success">{paidLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Paid Off</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 border border-border/50 text-center">
                    <p className="text-lg font-extrabold text-destructive">{activeLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Active</p>
                  </div>
                </div>

                {/* Collection progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">Collection Progress</span>
                    <span className="font-semibold">{totalLoanAmount > 0 ? ((totalCollected / totalLoanAmount) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalLoanAmount > 0 ? (totalCollected / totalLoanAmount) * 100 : 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Collected: ₱{totalCollected.toLocaleString()}</span>
                    <span>Total: ₱{totalLoanAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Loans by type bar chart */}
                {loanTypeData.length > 0 && (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={loanTypeData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, ""]} />
                      <Bar dataKey="amount" fill="hsl(225, 75%, 45%)" radius={[4, 4, 0, 0]} name="Total Amount" />
                      <Bar dataKey="remaining" fill="hsl(0, 78%, 52%)" radius={[4, 4, 0, 0]} name="Remaining" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No loans recorded yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense by Position + Top Earners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Expense by Position</h3>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-card-foreground mb-4">Top Earners (Cumulative)</h3>
            {topEarners.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topEarners} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Total"]} />
                  <Bar dataKey="total" fill="hsl(225, 75%, 45%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}