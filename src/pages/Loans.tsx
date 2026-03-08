import { useState } from "react";
import { useEmployees } from "@/hooks/usePayrollData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Landmark, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
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

// Color-blind safe status indicators with shape + label
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

  const filtered = loans?.filter((l: any) => {
    const name = `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase()) || l.loan_type.toLowerCase().includes(search.toLowerCase());
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (loan: any) => {
    setEditId(loan.id);
    setForm({
      employee_id: loan.employee_id,
      loan_type: loan.loan_type,
      amount: String(loan.amount),
      monthly_deduction: String(loan.monthly_deduction),
      remaining_balance: String(loan.remaining_balance),
      start_date: loan.start_date || "",
      remarks: loan.remarks || "",
      status: loan.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.amount || !form.monthly_deduction) {
      toast.error("Please fill in required fields."); return;
    }
    setSaving(true);
    try {
      const amount = parseFloat(form.amount);
      const monthlyDeduction = parseFloat(form.monthly_deduction);
      if (editId) {
        const { error } = await (supabase as any).from("loans").update({
          loan_type: form.loan_type,
          amount,
          remaining_balance: parseFloat(form.remaining_balance || String(amount)),
          monthly_deduction: monthlyDeduction,
          start_date: form.start_date || null,
          remarks: form.remarks || null,
          status: form.status,
        }).eq("id", editId);
        if (error) throw error;
        toast.success("Loan updated!");
      } else {
        const { error } = await (supabase as any).from("loans").insert({
          employee_id: form.employee_id,
          loan_type: form.loan_type,
          amount,
          remaining_balance: amount,
          monthly_deduction: monthlyDeduction,
          start_date: form.start_date || null,
          remarks: form.remarks || null,
          status: "active",
        });
        if (error) throw error;
        toast.success("Loan added!");
      }
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await (supabase as any).from("loans").delete().eq("id", deleteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast.success("Loan removed.");
    } catch (err: any) { toast.error(err.message); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Loans</h1>
            <p className="text-xs text-muted-foreground">{loans?.length || 0} loans recorded</p>
          </div>
        </div>
        <Button onClick={openAdd} className="font-semibold gap-2">
          <Plus className="h-4 w-4" /> Add Loan
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search loans..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Employee</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Loan Type</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Monthly Ded.</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Remaining</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Start Date</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Remarks</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">No loans found</TableCell></TableRow>
              ) : (
                filtered?.map((loan: any) => {
                  const sc = statusConfig[loan.status] || statusConfig.active;
                  return (
                    <TableRow key={loan.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm">{loan.employees?.first_name} {loan.employees?.last_name}</TableCell>
                      <TableCell className="text-sm">{loan.loan_type}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">₱{Number(loan.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₱{Number(loan.monthly_deduction).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₱{Number(loan.remaining_balance).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{loan.start_date || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="text-[10px] font-semibold uppercase gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{loan.remarks || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(loan)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(loan.id)} title="Delete">
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
        </CardContent>
      </Card>

      {/* Add/Edit Loan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-bold">{editId ? "Edit Loan" : "Add New Loan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Employee *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })} disabled={!!editId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{loanTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Amount (₱) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Monthly Deduction (₱) *</Label>
                <Input type="number" value={form.monthly_deduction} onChange={(e) => setForm({ ...form, monthly_deduction: e.target.value })} />
              </div>
              {editId && (
                <div>
                  <Label className="text-xs font-semibold">Remaining Balance (₱)</Label>
                  <Input type="number" value={form.remaining_balance} onChange={(e) => setForm({ ...form, remaining_balance: e.target.value })} />
                </div>
              )}
              <div>
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Remarks</Label>
                <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." />
              </div>
              {editId && (
                <div>
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{loanStatuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update Loan" : "Add Loan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Loan</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this loan record? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
