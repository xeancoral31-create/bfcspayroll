import { useState, useEffect } from "react";
import { useEmployees, usePayrollRecords } from "@/hooks/usePayrollData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calculator, CheckCircle, Plus, Trash2, Save, FolderOpen } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface EarningItem {
  id: string;
  name: string;
  amount: number;
}

interface DeductionPreset {
  id: string;
  name: string;
  sss: number;
  philHealth: number;
  pagIbig: number;
  withholdingTax: number;
}

const PRESETS_KEY = "payroll_deduction_presets";

function loadPresets(): DeductionPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePresets(presets: DeductionPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Presets
  const [presets, setPresets] = useState<DeductionPreset[]>(loadPresets);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saveMode, setSaveMode] = useState(false); // true = saving, false = loading

  useEffect(() => {
    savePresets(presets);
  }, [presets]);

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

  const setNonNegative = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setter(val < 0 ? 0 : val);
  };

  const updateEarningAmount = (id: string, raw: string) => {
    const val = Number(raw);
    updateEarningItem(id, "amount", val < 0 ? 0 : val);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedId) errs.employee = "Please select an employee.";

    // Check earning amounts
    for (const item of earningItems) {
      if (item.amount < 0) {
        errs[`earning_${item.id}`] = "Amount cannot be negative.";
      }
    }

    // Require all deduction fields (must be > 0)
    if (sss <= 0) errs.sss = "SSS amount is required.";
    if (philHealth <= 0) errs.philHealth = "PhilHealth amount is required.";
    if (pagIbig <= 0) errs.pagIbig = "Pag-IBIG amount is required.";
    if (withholdingTax <= 0) errs.withholdingTax = "Withholding Tax is required.";

    // Check for negative deductions
    if (sss < 0) errs.sss = "Cannot be negative.";
    if (philHealth < 0) errs.philHealth = "Cannot be negative.";
    if (pagIbig < 0) errs.pagIbig = "Cannot be negative.";
    if (withholdingTax < 0) errs.withholdingTax = "Cannot be negative.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCompute = () => {
    if (!validate()) {
      toast.error("Please fix the errors before computing.");
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
    const record = processPayrollManual(selected!, period, allowances, 0, deductions);
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
    setErrors({});
  };

  // Preset functions
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name.");
      return;
    }
    const preset: DeductionPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      sss,
      philHealth,
      pagIbig,
      withholdingTax,
    };
    setPresets((prev) => [...prev, preset]);
    setPresetDialogOpen(false);
    setPresetName("");
    toast.success(`Preset "${preset.name}" saved!`);
  };

  const handleLoadPreset = (preset: DeductionPreset) => {
    setSss(preset.sss);
    setPhilHealth(preset.philHealth);
    setPagIbig(preset.pagIbig);
    setWithholdingTax(preset.withholdingTax);
    setPresetDialogOpen(false);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    toast.success("Preset deleted.");
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
                <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setErrors((e) => { const { employee, ...rest } = e; return rest; }); }}>
                  <SelectTrigger className={errors.employee ? "border-destructive" : ""}><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employee && <p className="text-xs text-destructive">{errors.employee}</p>}
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
                    <div key={item.id}>
                      <div className="flex items-end gap-2">
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
                            min="0"
                            value={item.amount || ""}
                            onChange={(e) => updateEarningAmount(item.id, e.target.value)}
                            className={errors[`earning_${item.id}`] ? "border-destructive" : ""}
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
                      {errors[`earning_${item.id}`] && <p className="text-xs text-destructive mt-1">{errors[`earning_${item.id}`]}</p>}
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Enter the deduction amounts manually.</p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => { setSaveMode(false); setPresetDialogOpen(true); }}>
                        <FolderOpen className="mr-1 h-3.5 w-3.5" /> Load Preset
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSaveMode(true); setPresetName(""); setPresetDialogOpen(true); }}>
                        <Save className="mr-1 h-3.5 w-3.5" /> Save Preset
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>SSS <span className="text-destructive">*</span></Label>
                      <Input type="number" min="0" value={sss || ""} onChange={setNonNegative(setSss)} placeholder="0.00" className={errors.sss ? "border-destructive" : ""} />
                      {errors.sss && <p className="text-xs text-destructive">{errors.sss}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>PhilHealth <span className="text-destructive">*</span></Label>
                      <Input type="number" min="0" value={philHealth || ""} onChange={setNonNegative(setPhilHealth)} placeholder="0.00" className={errors.philHealth ? "border-destructive" : ""} />
                      {errors.philHealth && <p className="text-xs text-destructive">{errors.philHealth}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pag-IBIG <span className="text-destructive">*</span></Label>
                      <Input type="number" min="0" value={pagIbig || ""} onChange={setNonNegative(setPagIbig)} placeholder="0.00" className={errors.pagIbig ? "border-destructive" : ""} />
                      {errors.pagIbig && <p className="text-xs text-destructive">{errors.pagIbig}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Withholding Tax <span className="text-destructive">*</span></Label>
                      <Input type="number" min="0" value={withholdingTax || ""} onChange={setNonNegative(setWithholdingTax)} placeholder="0.00" className={errors.withholdingTax ? "border-destructive" : ""} />
                      {errors.withholdingTax && <p className="text-xs text-destructive">{errors.withholdingTax}</p>}
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
                <p className={`text-2xl font-bold ${netPay < 0 ? "text-destructive" : "text-primary"}`}>{fmt(netPay)}</p>
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

      {/* Preset Dialog */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{saveMode ? "Save Deduction Preset" : "Load Deduction Preset"}</DialogTitle>
          </DialogHeader>
          {saveMode ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Preset Name</Label>
                <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="e.g. Regular Teacher" />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <Row label="SSS" value={fmt(sss)} />
                <Row label="PhilHealth" value={fmt(philHealth)} />
                <Row label="Pag-IBIG" value={fmt(pagIbig)} />
                <Row label="Withholding Tax" value={fmt(withholdingTax)} />
              </div>
              <Button onClick={handleSavePreset} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save Preset
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {presets.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No presets saved yet. Enter deduction amounts and click "Save Preset".</p>
              ) : (
                presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                    <button className="flex-1 text-left" onClick={() => handleLoadPreset(p)}>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SSS: {fmt(p.sss)} • PH: {fmt(p.philHealth)} • PI: {fmt(p.pagIbig)} • Tax: {fmt(p.withholdingTax)}
                      </p>
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePreset(p.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
