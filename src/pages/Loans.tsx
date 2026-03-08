import { useState } from "react";
import { useEmployees } from "@/hooks/usePayrollData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Landmark, Plus, Pencil, Trash2, Search, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface LoanForm {
  employee_id: string;
  loan_type: string;
  amount: string;
  monthly_deduction: string;
  remaining_balance: string;
  start_date: string;
  remarks: string;
  status: string;
}

const emptyForm: LoanForm = {
  employee_id: "", loan_type: "SSS", amount: "", monthly_deduction: "",
  remaining_balance: "", start_date: "", remarks: "", status: "active",
};

const loanTypes = ["SSS", "Pag-IBIG", "Company", "Salary", "Emergency", "Other"];
const loanStatuses = ["active", "paid", "cancelled"];

export function useLoans(employeeId?: string) {
  return useQuery({
    queryKey: employeeId ? ["loans", employeeId] : ["loans"],
    queryFn: async () => {
      let query = (supabase as any)
        .from("loans")
        .select("*, employees(first_name, last_name)")
        .order("created_at", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId).eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive"; dot: string; label: string }> = {
  active: { variant: "secondary", dot: "bg-primary", label: "Active" },
  paid: { variant: "default", dot: "bg-success", label: "Paid" },
  cancelled: { variant: "destructive", dot: "bg-destructive", label: "Cancelled" },
};

export default function Loans() {
  const { data: employees } = useEmployees();
  const { data: loans, isLoading } = useLoans();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LoanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = loans?.filter((l: any) => {
    const name = `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || l.loan_type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || l.loan_type === filterType;
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalLoans = loans?.length || 0;
  const activeLoans = loans?.filter((l: any) => l.status === "active") || [];
  const paidLoans = loans?.filter((l: any) => l.status === "paid") || [];
  const totalOutstanding = activeLoans.reduce((s: number, l: any) => s + Number(l.remaining_balance), 0);
  const totalAmount = loans?.reduce((s: number, l: any) => s + Number(l.amount), 0) || 0;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (loan: any) => {
    setEditId(loan.id);
    setForm({
      employee_id: loan.employee_id, loan_type: loan.loan_type,
      amount: String(loan.amount), monthly_deduction: String(loan.monthly_deduction),
      remaining_balance: String(loan.remaining_balance),
      start_date: loan.start_date || "", remarks: loan.remarks || "", status: loan.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.amount || !form.monthly_deduction) {
      toast.error("Please fill in all required fields."); return;
    }
    setSaving(true);
    try {
      const amount = parseFloat(form.amount);
      const monthlyDeduction = parseFloat(form.monthly_deduction);
      if (editId) {
        const { error } = await (supabase as any).from("loans").update({
          loan_type: form.loan_type, amount,
          remaining_balance: parseFloat(form.remaining_balance || String(amount)),
          monthly_deduction: monthlyDeduction,
          start_date: form.start_date || null, remarks: form.remarks || null, status: form.status,
        }).eq("id", editId);
        if (error) throw error;
        toast.success("Loan updated successfully!");
      } else {
        const { error } = await (supabase as any).from("loans").insert({
          employee_id: form.employee_id, loan_type: form.loan_type, amount,
          remaining_balance: amount, monthly_deduction: monthlyDeduction,
          start_date: form.start_date || null, remarks: form.remarks || null, status: "active",
        });
        if (error) throw error;
        const emp = employees?.find((e) => e.id === form.employee_id);
        const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
        await createNotification(
          "New Loan Recorded",
          `${form.loan_type} loan of ₱${amount.toLocaleString()} recorded for ${empName}.`,
          "warning"
        );
        toast.success("Loan recorded successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setDialogOpen(false); setForm(emptyForm);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await (supabase as any).from("loans").delete().eq("id", deleteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast.success("Loan record removed.");
    } catch (err: any) { toast.error(err.message); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Loan Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage employee loans, deductions, and repayment progress.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" /> Record New Loan
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/8 p-2.5"><Landmark className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xl font-bold font-mono text-foreground">{totalLoans}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/8 p-2.5"><DollarSign className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-lg font-bold font-mono text-foreground">₱{totalOutstanding.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success/8 p-2.5"><CheckCircle2 className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xl font-bold font-mono text-foreground">{paidLoans.length}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Fully Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning/8 p-2.5"><Landmark className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-xl font-bold font-mono text-foreground">{activeLoans.length}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by employee or loan type..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {loanTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {loanStatuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-3.5">Employee</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Type</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Loan Amount</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Monthly</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Progress</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <div className="h-8 w-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <Landmark className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-sm font-medium">No loans found</p>
                </TableCell></TableRow>
              ) : (
                filtered?.map((loan: any) => {
                  const sc = statusConfig[loan.status] || statusConfig.active;
                  const paid = Number(loan.amount) - Number(loan.remaining_balance);
                  const paidPct = Number(loan.amount) > 0 ? (paid / Number(loan.amount)) * 100 : 0;
                  return (
                    <TableRow key={loan.id} className="hover:bg-muted/20 transition-colors group">
                      <TableCell>
                        <p className="text-sm font-semibold text-foreground">{loan.employees?.first_name} {loan.employees?.last_name}</p>
                        <p className="text-[10px] text-muted-foreground">{loan.start_date || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-semibold">{loan.loan_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">₱{Number(loan.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">₱{Number(loan.monthly_deduction).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">₱{paid.toLocaleString()} paid</span>
                            <span className="font-semibold text-foreground">{paidPct.toFixed(0)}%</span>
                          </div>
                          <Progress value={paidPct} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="text-[10px] font-semibold uppercase gap-1.5 px-2.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(loan)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteId(loan.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {filtered && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <p className="text-[11px] text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {totalLoans} loans
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Loan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editId ? "Edit Loan" : "Record New Loan"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editId ? "Update the loan details below." : "Fill in the loan information for the employee."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 py-1">
            <div>
              <Label className="text-xs font-semibold">Employee <span className="text-destructive">*</span></Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })} disabled={!!editId}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Loan Type</Label>
                <Select value={form.loan_type} onValueChange={(v) => setForm({ ...form, loan_type: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{loanTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Loan Amount (₱) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Monthly Deduction (₱) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.monthly_deduction} onChange={(e) => setForm({ ...form, monthly_deduction: e.target.value })} className="h-10" />
              </div>
              {editId && (
                <div>
                  <Label className="text-xs font-semibold">Remaining Balance (₱)</Label>
                  <Input type="number" value={form.remaining_balance} onChange={(e) => setForm({ ...form, remaining_balance: e.target.value })} className="h-10" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-10" /></div>
              <div><Label className="text-xs font-semibold">Remarks</Label><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." className="h-10" /></div>
            </div>
            {editId && (
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="w-[160px] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{loanStatuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">{saving ? "Saving..." : editId ? "Update Loan" : "Record Loan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Remove Loan Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this loan record? This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Loan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
