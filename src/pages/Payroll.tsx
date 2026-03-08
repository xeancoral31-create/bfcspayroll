import { useState, useEffect } from "react";
import { useEmployees, usePayrollActions, usePayrollRecords } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Play, History } from "lucide-react";
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

  // Fetch active loans for selected employee
  const { data: activeLoans } = useLoans(selectedId || undefined);

  const selected = activeEmployees.find((e) => e.id === selectedId);
  const basicSalary = selected ? Number(selected.basic_salary) : 0;
  const grossPay = basicSalary + Number(overtime || 0) + Number(allowances || 0);

  const loanDeduction = (activeLoans || []).reduce((sum: number, l: any) => {
    const ded = Math.min(Number(l.monthly_deduction), Number(l.remaining_balance));
    return sum + ded;
  }, 0);

  const totalDeductions = [sss, philhealth, pagibig, tax, otherDed].reduce((s, v) => s + Number(v || 0), 0) + loanDeduction;
  const netPay = grossPay - totalDeductions;

  const handleProcess = async () => {
    if (!selectedId || !period) { toast.error("Select an employee and pay period."); return; }
    if (netPay < 0) { toast.error("Net pay cannot be negative."); return; }
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

      // Update loan remaining balances
      for (const loan of (activeLoans || [])) {
        const ded = Math.min(Number(loan.monthly_deduction), Number(loan.remaining_balance));
        const newBalance = Math.round((Number(loan.remaining_balance) - ded) * 100) / 100;
        await (supabase as any).from("loans").update({
          remaining_balance: newBalance,
          status: newBalance <= 0 ? "paid" : "active",
        }).eq("id", loan.id);
      }
      queryClient.invalidateQueries({ queryKey: ["loans"] });

      // Reset
      setOvertime("0"); setAllowances("0"); setSss("0"); setPhilhealth("0"); setPagibig("0"); setTax("0"); setOtherDed("0");
    } catch (err: any) { toast.error(err.message); }
    setProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">Run Payroll</h1>
          <p className="text-xs text-muted-foreground">Process salary for staff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input Panel */}
        <Card className="lg:col-span-3 border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Employee</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Pay Period</Label>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. March 2026" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Period Type</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="max-w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Earnings */}
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Earnings</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Basic Salary</Label>
                  <Input value={basicSalary.toLocaleString()} disabled className="font-mono font-semibold bg-muted/50" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Overtime (₱)</Label>
                  <Input type="number" value={overtime} onChange={(e) => setOvertime(e.target.value)} min="0" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Allowances (₱)</Label>
                  <Input type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} min="0" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Deductions */}
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Deductions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-[11px] text-muted-foreground">SSS</Label><Input type="number" value={sss} onChange={(e) => setSss(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">PhilHealth</Label><Input type="number" value={philhealth} onChange={(e) => setPhilhealth(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Pag-IBIG</Label><Input type="number" value={pagibig} onChange={(e) => setPagibig(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Withholding Tax</Label><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Other Deductions</Label><Input type="number" value={otherDed} onChange={(e) => setOtherDed(e.target.value)} min="0" /></div>
              </div>
            </div>

            {/* Loan Deductions (auto) */}
            {selectedId && (activeLoans || []).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Loan Deductions (Auto)</p>
                  <div className="space-y-1.5">
                    {(activeLoans || []).map((loan: any) => {
                      const ded = Math.min(Number(loan.monthly_deduction), Number(loan.remaining_balance));
                      return (
                        <div key={loan.id} className="flex justify-between items-center text-sm rounded-md bg-muted/40 px-3 py-1.5 border border-border/50">
                          <span className="text-muted-foreground">{loan.loan_type} Loan</span>
                          <span className="font-mono font-semibold text-destructive">-₱{ded.toLocaleString()}</span>
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
        <Card className="lg:col-span-2 border-border/50 h-fit">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Pay Summary</h3>

            {selected && (
              <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                <p className="text-sm font-bold">{selected.first_name} {selected.last_name}</p>
                <p className="text-[11px] text-muted-foreground">{selected.position}</p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Basic Salary</span><span className="font-mono font-semibold">₱{basicSalary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overtime</span><span className="font-mono">₱{Number(overtime || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Allowances</span><span className="font-mono">₱{Number(allowances || 0).toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Gross Pay</span><span className="font-mono text-primary">₱{grossPay.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between text-destructive"><span>Gov't Deductions</span><span className="font-mono">-₱{([sss, philhealth, pagibig, tax, otherDed].reduce((s, v) => s + Number(v || 0), 0)).toLocaleString()}</span></div>
              {loanDeduction > 0 && (
                <div className="flex justify-between text-destructive"><span>Loan Deductions</span><span className="font-mono">-₱{loanDeduction.toLocaleString()}</span></div>
              )}
              <div className="flex justify-between text-destructive font-semibold"><span>Total Deductions</span><span className="font-mono">-₱{totalDeductions.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-extrabold">
                <span>Net Pay</span>
                <span className={`font-mono ${netPay >= 0 ? "text-success" : "text-destructive"}`}>₱{netPay.toLocaleString()}</span>
              </div>
            </div>

            <Button onClick={handleProcess} disabled={processing || !selectedId} className="w-full font-bold">
              <Play className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : "Process Payroll"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Payroll History</h3>
          </div>

          {(() => {
            const historyRecords = selectedId
              ? (allRecords || []).filter((r: any) => r.employee_id === selectedId)
              : (allRecords || []);

            if (historyRecords.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-6">No payroll history {selectedId ? "for this employee" : "yet"}</p>;
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold">Employee</TableHead>
                    <TableHead className="font-bold">Period</TableHead>
                    <TableHead className="text-right font-bold">Gross</TableHead>
                    <TableHead className="text-right font-bold">Gov't Ded.</TableHead>
                    <TableHead className="text-right font-bold">Loan Ded.</TableHead>
                    <TableHead className="text-right font-bold">Net Pay</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRecords.map((r: any) => {
                    const ded = typeof r.deductions === "object" ? r.deductions : {};
                    const govtDed = (Number(ded.sss || 0) + Number(ded.philhealth || 0) + Number(ded.pagibig || 0) + Number(ded.withholding_tax || 0) + Number(ded.other || 0));
                    const loanDed = Number(ded.loans || 0);
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                            </div>
                            <span className="text-sm font-semibold">{r.employees?.first_name} {r.employees?.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{r.period}</TableCell>
                        <TableCell className="text-right font-mono text-sm">₱{Number(r.gross_pay).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">
                          {govtDed > 0 ? `-₱${govtDed.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-destructive">
                          {loanDed > 0 ? `-₱${loanDed.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-success">₱{Number(r.net_pay).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
