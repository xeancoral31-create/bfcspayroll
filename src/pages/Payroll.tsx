import { useState } from "react";
import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, CheckCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface EarningItem {
  id: string;
  name: string;
  amount: number;
}

export default function Payroll() {
  const { employees } = useEmployees();
  const { processPayrollManual } = usePayrollRecords();
  const activeEmployees = employees.filter((e) => e.status === "active");

  const [selectedId, setSelectedId] = useState("");
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [result, setResult] = useState<any>(null);

  // Gross Pay tab - additional earnings
  const [earningItems, setEarningItems] = useState<EarningItem[]>([
    { id: "allowance", name: "Allowances", amount: 0 },
    { id: "overtime", name: "Overtime Pay", amount: 0 },
  ]);

  // Deductions tab - cashier manually inputs
  const [sss, setSss] = useState(0);
  const [philHealth, setPhilHealth] = useState(0);
  const [pagIbig, setPagIbig] = useState(0);
  const [withholdingTax, setWithholdingTax] = useState(0);

  const selected = activeEmployees.find((e) => e.id === selectedId);

  const totalEarnings = earningItems.reduce((sum, item) => sum + item.amount, 0);
  const grossPay = (selected?.basicSalary ?? 0) + totalEarnings;
  const totalDeductions = sss + philHealth + pagIbig + withholdingTax;
  const netPay = grossPay - totalDeductions;

  const addEarningItem = () => {
    setEarningItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", amount: 0 }]);
  };

  const updateEarningItem = (id: string, field: "name" | "amount", value: string | number) => {
    setEarningItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeEarningItem = (id: string) => {
    setEarningItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCompute = () => {
    if (!selected) {
      toast.error("Please select an employee.");
      return;
    }
    const period = `${month} ${year}`;
    const deductions = [
      { name: "SSS", amount: sss, type: "fixed" as const },
      { name: "PhilHealth", amount: philHealth, type: "fixed" as const },
      { name: "Pag-IBIG", amount: pagIbig, type: "fixed" as const },
      { name: "Withholding Tax", amount: withholdingTax, type: "fixed" as const },
    ];
    const allowances = earningItems.reduce((sum, item) => sum + item.amount, 0);
    const record = processPayrollManual(selected, period, allowances, 0, deductions);
    setResult(record);
    toast.success("Payroll processed successfully!");
  };

  const reset = () => {
    setSelectedId("");
    setEarningItems([
      { id: "allowance", name: "Allowances", amount: 0 },
      { id: "overtime", name: "Overtime Pay", amount: 0 },
    ]);
    setSss(0);
    setPhilHealth(0);
    setPagIbig(0);
    setWithholdingTax(0);
    setResult(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Run Payroll</h1>
        <p className="text-sm text-muted-foreground">Compute salary, deductions, and generate payroll record</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Side */}
        <div className="space-y-4">
          {/* Employee & Period Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Employee & Period</CardTitle>
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
            </CardContent>
          </Card>

          {/* Tabs for Gross Pay & Deductions */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <Tabs defaultValue="gross-pay">
                <TabsList className="w-full">
                  <TabsTrigger value="gross-pay" className="flex-1">Gross Pay</TabsTrigger>
                  <TabsTrigger value="deductions" className="flex-1">Deductions</TabsTrigger>
                </TabsList>

                {/* Gross Pay Tab */}
                <TabsContent value="gross-pay" className="space-y-4 pt-4">
                  <p className="text-xs text-muted-foreground">Add allowances, overtime, and other earnings on top of the basic salary.</p>
                  {earningItems.map((item) => (
                    <div key={item.id} className="flex items-end gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateEarningItem(item.id, "name", e.target.value)}
                          placeholder="e.g. Allowance"
                        />
                      </div>
                      <div className="w-32 space-y-1.5">
                        <Label className="text-xs">Amount (₱)</Label>
                        <Input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) => updateEarningItem(item.id, "amount", Number(e.target.value))}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mb-0.5 text-destructive hover:text-destructive"
                        onClick={() => removeEarningItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addEarningItem} className="w-full">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Earning
                  </Button>
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Gross Pay</span>
                    <span className="font-mono text-foreground">{fmt(grossPay)}</span>
                  </div>
                </TabsContent>

                {/* Deductions Tab */}
                <TabsContent value="deductions" className="space-y-4 pt-4">
                  <p className="text-xs text-muted-foreground">Enter the deduction amounts manually.</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>SSS</Label>
                      <Input type="number" value={sss || ""} onChange={(e) => setSss(Number(e.target.value))} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>PhilHealth</Label>
                      <Input type="number" value={philHealth || ""} onChange={(e) => setPhilHealth(Number(e.target.value))} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pag-IBIG</Label>
                      <Input type="number" value={pagIbig || ""} onChange={(e) => setPagIbig(Number(e.target.value))} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Withholding Tax</Label>
                      <Input type="number" value={withholdingTax || ""} onChange={(e) => setWithholdingTax(Number(e.target.value))} placeholder="0.00" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Total Deductions</span>
                    <span className="font-mono text-foreground">{fmt(totalDeductions)}</span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Live Net Pay Preview */}
          {selected && (
            <Card className="border-2 border-primary/20 bg-primary/5 shadow-card">
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground">ESTIMATED NET PAY</p>
                <p className="text-2xl font-bold text-primary">{fmt(netPay)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gross {fmt(grossPay)} − Deductions {fmt(totalDeductions)}
                </p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleCompute} className="w-full" disabled={!selectedId}>
            <Calculator className="mr-2 h-4 w-4" />Compute & Save Payroll
          </Button>
        </div>

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
                  <Row label="Allowances / Extras" value={fmt(result.allowances)} />
                  <Separator />
                  <Row label="Gross Pay" value={fmt(result.grossPay)} bold />
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">DEDUCTIONS</p>
                  <div className="space-y-1.5 text-sm">
                    {result.deductions.map((d: any) => (
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
