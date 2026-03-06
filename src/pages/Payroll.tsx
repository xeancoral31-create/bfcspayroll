import { useState } from "react";
import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Payroll() {
  const { employees } = useEmployees();
  const { processPayroll } = usePayrollRecords();
  const activeEmployees = employees.filter((e) => e.status === "active");

  const [selectedId, setSelectedId] = useState("");
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [allowances, setAllowances] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof processPayroll> | null>(null);

  const selected = activeEmployees.find((e) => e.id === selectedId);

  const handleCompute = () => {
    if (!selected) {
      toast.error("Please select an employee.");
      return;
    }
    const period = `${month} ${year}`;
    const record = processPayroll(selected, period, allowances, overtime);
    setResult(record);
    toast.success("Payroll processed successfully!");
  };

  const reset = () => {
    setSelectedId("");
    setAllowances(0);
    setOvertime(0);
    setResult(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Run Payroll</h1>
        <p className="text-sm text-muted-foreground">Compute salary, deductions, and generate payroll record</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Payroll Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
            {selected && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Basic Monthly Salary</p>
                <p className="text-lg font-bold text-foreground">{fmt(selected.basicSalary)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Allowances</Label>
                <Input type="number" value={allowances || ""} onChange={(e) => setAllowances(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Overtime Pay</Label>
                <Input type="number" value={overtime || ""} onChange={(e) => setOvertime(Number(e.target.value))} />
              </div>
            </div>
            <Button onClick={handleCompute} className="w-full" disabled={!selectedId}>
              <Calculator className="mr-2 h-4 w-4" />Compute Payroll
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className={`shadow-card transition-opacity ${result ? "opacity-100" : "opacity-50"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {result && <CheckCircle className="h-4 w-4 text-success" />}
              Payroll Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Select an employee and compute payroll to see the summary.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{result.employee.firstName} {result.employee.lastName}</p>
                  <p className="text-xs text-muted-foreground">{result.employee.position} • {result.period}</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <Row label="Basic Salary" value={fmt(result.basicSalary)} />
                  <Row label="Allowances" value={fmt(result.allowances)} />
                  <Row label="Overtime" value={fmt(result.overtime)} />
                  <Separator />
                  <Row label="Gross Pay" value={fmt(result.grossPay)} bold />
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">DEDUCTIONS</p>
                  <div className="space-y-1.5 text-sm">
                    {result.deductions.map((d) => (
                      <Row key={d.name} label={d.name} value={`- ${fmt(d.amount)}`} />
                    ))}
                    <Separator />
                    <Row label="Total Deductions" value={fmt(result.totalDeductions)} bold />
                  </div>
                </div>
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground">NET PAY</p>
                  <p className="text-2xl font-bold text-primary">{fmt(result.netPay)}</p>
                </div>
                <Button variant="outline" onClick={reset} className="w-full">Process Another</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
