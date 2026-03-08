import { useRef } from "react";
import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Landmark, DollarSign, FileText, Printer, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

// Color-blind safe palette
const CB_COLORS = [
  "hsl(220, 70%, 42%)",
  "hsl(28, 85%, 52%)",
  "hsl(198, 65%, 38%)",
  "hsl(38, 88%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(180, 50%, 40%)",
];

export default function Reports() {
  const { data: employees } = useEmployees();
  const { data: records } = usePayrollRecords();
  const { data: loans } = useLoans();
  const reportRef = useRef<HTMLDivElement>(null);

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

  // Deductions breakdown
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

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) return;
    win.document.write(`
      <html><head><title>BFCS Payroll Reports</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1e2e; font-size: 13px; }
        h1 { font-size: 18px; color: #1a5fb4; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #333; margin: 20px 0 8px; }
        .subtitle { font-size: 11px; color: #666; margin-bottom: 20px; }
        .stats { display: flex; gap: 16px; margin-bottom: 24px; }
        .stat-card { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
        .stat-value { font-size: 20px; font-weight: 700; }
        .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 12px; }
        th { background: #f5f5f8; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        .text-right { text-align: right; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      <h1>BFCS Payroll Reports</h1>
      <p class="subtitle">Butuan Faith Christian School — Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      

      <h2>Deductions Breakdown</h2>
      <table>
        <thead><tr><th>Category</th><th class="text-right">Amount</th><th class="text-right">% of Total</th></tr></thead>
        <tbody>
          ${deductionPieData.map(d => {
            const pct = totalDeductions > 0 ? ((d.value / totalDeductions) * 100).toFixed(1) : "0";
            return `<tr><td>${d.name}</td><td class="text-right mono">₱${d.value.toLocaleString()}</td><td class="text-right">${pct}%</td></tr>`;
          }).join("")}
          <tr style="font-weight:700; border-top: 2px solid #333;"><td>Total</td><td class="text-right mono">₱${totalDeductions.toLocaleString()}</td><td class="text-right">100%</td></tr>
        </tbody>
      </table>

      <h2>Loans by Type</h2>
      <table>
        <thead><tr><th>Type</th><th class="text-right">Count</th><th class="text-right">Total Amount</th><th class="text-right">Remaining</th></tr></thead>
        <tbody>
          ${loanTypeData.map(d => `<tr><td>${d.name}</td><td class="text-right">${d.count}</td><td class="text-right mono">₱${d.amount.toLocaleString()}</td><td class="text-right mono">₱${d.remaining.toLocaleString()}</td></tr>`).join("")}
        </tbody>
      </table>

      <h2>Top Earners (Cumulative)</h2>
      <table>
        <thead><tr><th>Employee</th><th class="text-right">Total Net Pay</th></tr></thead>
        <tbody>
          ${(topEarners as any[]).map((e: any) => `<tr><td>${e.name}</td><td class="text-right mono">₱${e.total.toLocaleString()}</td></tr>`).join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>BFCS Payroll System — This report was generated automatically. For inquiries, contact the Finance Office.</p>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleExportCSV = () => {
    if (!records || records.length === 0) { return; }
    const headers = ["Employee", "Period", "Gross Pay", "Total Deductions", "Net Pay", "Status", "Date"];
    const rows = records.map((r: any) => [
      `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`,
      r.period,
      Number(r.gross_pay).toFixed(2),
      Number(r.total_deductions).toFixed(2),
      Number(r.net_pay).toFixed(2),
      r.status,
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bfcs-payroll-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tooltipStyle = {
    borderRadius: "8px",
    border: "1px solid hsl(220, 14%, 89%)",
    boxShadow: "0 4px 12px hsl(222, 28%, 14%, 0.08)",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comprehensive payroll analytics, deduction summaries, and financial insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="font-semibold gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={handlePrint} className="font-semibold gap-2 text-xs">
            <Printer className="h-3.5 w-3.5" /> Print Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-primary/8 p-2.5"><DollarSign className="h-5 w-5 text-primary" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">₱{totalDisbursed.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Total Disbursed</p>
          </CardContent>
        </Card>
        <Card className="border-accent/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-accent/8 p-2.5"><FileText className="h-5 w-5 text-accent" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">₱{totalDeductions.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Total Deductions</p>
          </CardContent>
        </Card>
        <Card className="border-warning/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-warning/8 p-2.5"><Landmark className="h-5 w-5 text-warning" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeLoans.length}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Active Loans</p>
            <p className="text-[10px] text-muted-foreground/60">₱{totalRemaining.toLocaleString()} outstanding</p>
          </CardContent>
        </Card>
        <Card className="border-success/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-success/8 p-2.5"><BarChart3 className="h-5 w-5 text-success" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{records?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Payroll Records</p>
            <p className="text-[10px] text-muted-foreground/60">{totalActive} active employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Payroll Trend */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Monthly Payroll Expenses</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [`₱${v.toLocaleString()}`, name]} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="gross" stroke="hsl(220, 70%, 42%)" fill="hsl(220, 70%, 42%)" fillOpacity={0.1} strokeWidth={2} name="Gross Pay" />
                <Area type="monotone" dataKey="net" stroke="hsl(198, 65%, 38%)" fill="hsl(198, 65%, 38%)" fillOpacity={0.1} strokeWidth={2} name="Net Pay" />
                <Area type="monotone" dataKey="deductions" stroke="hsl(28, 85%, 52%)" fill="hsl(28, 85%, 52%)" fillOpacity={0.05} strokeWidth={2} name="Total Deductions" />
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
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Deductions Breakdown</h3>
            {deductionPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={deductionPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deductionPieData.map((_, i) => <Cell key={i} fill={CB_COLORS[i % CB_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                  {deductionPieData.map((d, i) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: CB_COLORS[i % CB_COLORS.length] }} />
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

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Loan Statistics</h3>
            {(loans || []).length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3 border text-center">
                    <p className="text-lg font-bold text-foreground">{(loans || []).length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Total Loans</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 border text-center">
                    <p className="text-lg font-bold text-success">{paidLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Paid Off</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 border text-center">
                    <p className="text-lg font-bold text-accent">{activeLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Active</p>
                  </div>
                </div>

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

                {loanTypeData.length > 0 && (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={loanTypeData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(220, 8%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, ""]} contentStyle={tooltipStyle} />
                      <Bar dataKey="amount" fill="hsl(220, 70%, 42%)" radius={[4, 4, 0, 0]} name="Total Amount" />
                      <Bar dataKey="remaining" fill="hsl(28, 85%, 52%)" radius={[4, 4, 0, 0]} name="Remaining" />
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
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Expense by Position</h3>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deptData.map((_, i) => <Cell key={i} fill={CB_COLORS[i % CB_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Amount"]} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Top Earners (Cumulative)</h3>
            {topEarners.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topEarners} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "hsl(220, 8%, 46%)" }} />
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Total"]} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="hsl(220, 70%, 42%)" radius={[0, 6, 6, 0]} />
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
