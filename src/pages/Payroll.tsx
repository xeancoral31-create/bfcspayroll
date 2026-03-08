import { useState } from "react";
import { useEmployees, usePayrollActions } from "@/hooks/usePayrollData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Play } from "lucide-react";
import { toast } from "sonner";

export default function Payroll() {
  const { data: employees } = useEmployees();
  const { processPayroll } = usePayrollActions();
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

  const selected = activeEmployees.find((e) => e.id === selectedId);
  const basicSalary = selected ? Number(selected.basic_salary) : 0;
  const grossPay = basicSalary + Number(overtime || 0) + Number(allowances || 0);
  const totalDeductions = [sss, philhealth, pagibig, tax, otherDed].reduce((s, v) => s + Number(v || 0), 0);
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
          pagibig: Number(pagibig || 0), withholding_tax: Number(tax || 0), other: Number(otherDed || 0),
        },
        period,
        period_type: periodType,
      });
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
          <p className="text-xs text-muted-foreground">Process salary for cashier staff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input Panel */}
        <Card className="lg:col-span-3 border-border/50">
          <CardContent className="p-5 space-y-4">
            {/* Employee & Period */}
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
          </CardContent>
        </Card>

        {/* Summary Panel */}
        <Card className="lg:col-span-2 border-border/50 h-fit">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Pay Summary</h3>

            {selected && (
              <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                <p className="text-sm font-bold">{selected.first_name} {selected.last_name}</p>
                <p className="text-[11px] text-muted-foreground">{selected.position} · {selected.department}</p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Basic Salary</span><span className="font-mono font-semibold">₱{basicSalary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overtime</span><span className="font-mono">₱{Number(overtime || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Allowances</span><span className="font-mono">₱{Number(allowances || 0).toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Gross Pay</span><span className="font-mono text-primary">₱{grossPay.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between text-destructive"><span>Total Deductions</span><span className="font-mono">-₱{totalDeductions.toLocaleString()}</span></div>
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
    </div>
  );
}
