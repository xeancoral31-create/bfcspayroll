import { useState } from "react";
import { useEmployees, usePayrollActions, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Play, History, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Payroll() {
  const { data: employees } = useEmployees();
  const { processPayroll } = usePayrollActions();
  const { data: allRecords } = usePayrollRecords();
  const queryClient = useQueryClient();
  const activeEmployees = employees?.filter((e) => e.status === "active") || [];

  const [selectedId, setSelectedId] = useState("");
  const [period, setPeriod] = useState("");
  const [periodType, setPeriodType] = useState("monthly");
  const [overtime, setOvertime] = useState("0");
  const [allowances, setAllowances] = useState("0");
  const [sss, setSss] = useState("0");
  const [philhealth, setPhilhealth] = useState("0");
  const [pagibig, setPagibig] = useState("0");
  const [tax, setTax] = useState("0");
  const [otherDed, setOtherDed] = useState("0");
  const [processing, setProcessing] = useState(false);

  const { data: activeLoans } = useLoans(selectedId || undefined);

  const selected = activeEmployees.find((e) => e.id === selectedId);
  const basicSalary = selected ? Number(selected.basic_salary) : 0;
  const grossPay = basicSalary + Number(overtime || 0) + Number(allowances || 0);

  const loanDeduction = (activeLoans || []).reduce((sum: number, l: any) => {
    const ded = Math.min(Number(l.monthly_deduction), Number(l.remaining_balance));
    return sum + ded;
  }, 0);

  const govtDeductions = [sss, philhealth, pagibig, tax, otherDed].reduce((s, v) => s + Number(v || 0), 0);
  const totalDeductions = govtDeductions + loanDeduction;
  const netPay = grossPay - totalDeductions;

  const handleProcess = async () => {
    if (!selectedId || !period) { toast.error("Please select an employee and enter the pay period."); return; }
    if (netPay < 0) { toast.error("Net pay cannot be negative. Please review the deductions."); return; }
    setProcessing(true);
    try {
      await processPayroll(selectedId, {
        basic_salary: basicSalary,
        overtime: Number(overtime || 0),
        allowances: Number(allowances || 0),
        deductions: {
          sss: Number(sss || 0), philhealth: Number(philhealth || 0),
          pagibig: Number(pagibig || 0), withholding_tax: Number(tax || 0),
          other: Number(otherDed || 0), loans: loanDeduction,
        },
        period,
        period_type: periodType,
      });

      for (const loan of (activeLoans || [])) {
        const ded = Math.min(Number(loan.monthly_deduction), Number(loan.remaining_balance));
        const newBalance = Math.round((Number(loan.remaining_balance) - ded) * 100) / 100;
        await (supabase as any).from("loans").update({
          remaining_balance: newBalance,
          status: newBalance <= 0 ? "paid" : "active",
        }).eq("id", loan.id);
      }
      queryClient.invalidateQueries({ queryKey: ["loans"] });

      // Create notification
      await createNotification(
        "Payroll Processed",
        `${period} payroll processed for ${selected?.first_name} ${selected?.last_name}. Net pay: ₱${netPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        "success"
      );

      setOvertime("0"); setAllowances("0"); setSss("0"); setPhilhealth("0"); setPagibig("0"); setTax("0"); setOtherDed("0");
    } catch (err: any) { toast.error(err.message); }
    setProcessing(false);
  };

  const fmt = (n: number) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Process Payroll</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Calculate and process salary payments for active employees.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${selectedId ? "bg-success/10 text-success" : "bg-muted"}`}>
          {selectedId ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">1</span>}
          <span className="font-semibold">Select Employee</span>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${period ? "bg-success/10 text-success" : "bg-muted"}`}>
          {period ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">2</span>}
          <span className="font-semibold">Enter Details</span>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
          <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">3</span>
          <span className="font-semibold">Process</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 px-6 pt-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> Payroll Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Employee <span className="text-destructive">*</span></Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} — {e.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Pay Period <span className="text-destructive">*</span></Label>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. March 2026" className="h-10" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Period Type</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="w-[200px] h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-1 w-4 rounded-full bg-primary" /> Earnings
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Basic Salary</Label>
                  <Input value={fmt(basicSalary)} disabled className="font-mono font-semibold bg-muted/40 h-10" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Overtime (₱)</Label>
                  <Input type="number" value={overtime} onChange={(e) => setOvertime(e.target.value)} min="0" className="h-10" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Allowances (₱)</Label>
                  <Input type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} min="0" className="h-10" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-1 w-4 rounded-full bg-accent" /> Government Deductions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-[11px] text-muted-foreground">SSS</Label><Input type="number" value={sss} onChange={(e) => setSss(e.target.value)} min="0" className="h-10" /></div>
                <div><Label className="text-[11px] text-muted-foreground">PhilHealth</Label><Input type="number" value={philhealth} onChange={(e) => setPhilhealth(e.target.value)} min="0" className="h-10" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Pag-IBIG</Label><Input type="number" value={pagibig} onChange={(e) => setPagibig(e.target.value)} min="0" className="h-10" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Withholding Tax</Label><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} min="0" className="h-10" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Other</Label><Input type="number" value={otherDed} onChange={(e) => setOtherDed(e.target.value)} min="0" className="h-10" /></div>
              </div>
            </div>

            {selectedId && (activeLoans || []).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="h-1 w-4 rounded-full bg-warning" /> Loan Deductions
                    <Badge variant="secondary" className="text-[9px] font-semibold ml-auto">Auto-calculated</Badge>
                  </p>
                  <div className="space-y-2">
                    {(activeLoans || []).map((loan: any) => {
                      const ded = Math.min(Number(loan.monthly_deduction), Number(loan.remaining_balance));
                      return (
                        <div key={loan.id} className="flex justify-between items-center text-sm rounded-xl bg-warning/5 px-4 py-2.5 border border-warning/15">
                          <div>
                            <span className="font-medium text-foreground">{loan.loan_type} Loan</span>
                            <p className="text-[10px] text-muted-foreground">Bal: ₱{Number(loan.remaining_balance).toLocaleString()}</p>
                          </div>
                          <span className="font-mono font-bold text-accent">-{fmt(ded)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Panel */}
        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-6">
          <CardHeader className="pb-3 px-6 pt-5">
            <CardTitle className="text-sm font-bold">Pay Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {selected ? (
              <div className="rounded-xl bg-primary/5 p-4 border border-primary/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                    {selected.first_name[0]}{selected.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{selected.first_name} {selected.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">{selected.position} · {selected.employee_id}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 p-4 border border-dashed text-center">
                <p className="text-xs text-muted-foreground">Select an employee to begin</p>
              </div>
            )}

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Basic Salary</span><span className="font-mono font-medium">{fmt(basicSalary)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overtime</span><span className="font-mono">{fmt(Number(overtime || 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Allowances</span><span className="font-mono">{fmt(Number(allowances || 0))}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Gross Pay</span><span className="font-mono text-primary">{fmt(grossPay)}</span></div>
              <Separator />
              <div className="flex justify-between text-muted-foreground"><span>Gov't Deductions</span><span className="font-mono text-accent">-{fmt(govtDeductions)}</span></div>
              {loanDeduction > 0 && (
                <div className="flex justify-between text-muted-foreground"><span>Loan Deductions</span><span className="font-mono text-accent">-{fmt(loanDeduction)}</span></div>
              )}
              <div className="flex justify-between font-semibold text-accent"><span>Total Deductions</span><span className="font-mono">-{fmt(totalDeductions)}</span></div>
            </div>

            <Separator />

            {/* Net Pay */}
            <div className="rounded-xl bg-primary p-4 text-center">
              <p className="text-[10px] text-primary-foreground/70 uppercase tracking-widest font-semibold">Net Pay</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${netPay >= 0 ? "text-primary-foreground" : "text-destructive-foreground"}`}>
                {fmt(netPay)}
              </p>
            </div>

            {netPay < 0 && (
              <div className="flex items-center gap-2 text-destructive text-xs rounded-lg bg-destructive/10 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Net pay is negative. Please review deductions.</span>
              </div>
            )}

            <Button onClick={handleProcess} disabled={processing || !selectedId || !period} className="w-full h-11 font-semibold gap-2 text-sm">
              <Play className="h-4 w-4" />
              {processing ? "Processing..." : "Process Payroll"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader className="pb-3 px-6 pt-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Recent Payroll History
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {selectedId ? "Filtered" : "All employees"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {(() => {
            const historyRecords = selectedId
              ? (allRecords || []).filter((r: any) => r.employee_id === selectedId)
              : (allRecords || []).slice(0, 10);

            if (historyRecords.length === 0) {
              return (
                <div className="text-center py-10">
                  <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground font-medium">No payroll history {selectedId ? "for this employee" : "yet"}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Processed payrolls will appear here</p>
                </div>
              );
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-3">Employee</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Period</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Gross</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Deductions</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Net Pay</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRecords.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
                            {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                          </div>
                          <span className="text-sm font-semibold">{r.employees?.first_name} {r.employees?.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.period}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(Number(r.gross_pay))}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-accent">-{fmt(Number(r.total_deductions))}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-primary">{fmt(Number(r.net_pay))}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
