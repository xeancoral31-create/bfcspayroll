import { useState } from "react";
import { useEmployees } from "@/hooks/usePayrollData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Landmark, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface LoanForm {
  employee_id: string;
  loan_type: string;
  amount: string;
  monthly_deduction: string;
  start_date: string;
  remarks: string;
}

const emptyForm: LoanForm = {
  employee_id: "",
  loan_type: "SSS",
  amount: "",
  monthly_deduction: "",
  start_date: "",
  remarks: "",
};

const loanTypes = ["SSS", "Pag-IBIG", "Company", "Salary", "Emergency", "Other"];

function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("loans")
        .select("*, employees(first_name, last_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function Loans() {
  const { data: employees } = useEmployees();
  const { data: loans, isLoading } = useLoans();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<LoanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = loans?.filter((l: any) => {
    const name = `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase()) || l.loan_type.toLowerCase().includes(search.toLowerCase());
  });

  const handleSave = async () => {
    if (!form.employee_id || !form.amount || !form.monthly_deduction) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSaving(true);
    try {
      const amount = parseFloat(form.amount);
      const monthlyDeduction = parseFloat(form.monthly_deduction);
      const { error } = await supabase.from("loans").insert({
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
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast.success("Loan added successfully!");
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Loans</h1>
            <p className="text-xs text-muted-foreground">{loans?.length || 0} loans recorded</p>
          </div>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} className="font-semibold">
          <Plus className="h-4 w-4 mr-1.5" /> Add Loan
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search loans..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-bold">Employee</TableHead>
                <TableHead className="font-bold">Loan Type</TableHead>
                <TableHead className="text-right font-bold">Amount</TableHead>
                <TableHead className="text-right font-bold">Monthly Deduction</TableHead>
                <TableHead className="text-right font-bold">Remaining</TableHead>
                <TableHead className="font-bold">Start Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No loans found</TableCell></TableRow>
              ) : (
                filtered?.map((loan: any) => (
                  <TableRow key={loan.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      {loan.employees?.first_name} {loan.employees?.last_name}
                    </TableCell>
                    <TableCell className="text-sm">{loan.loan_type}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-sm">₱{Number(loan.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">₱{Number(loan.monthly_deduction).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">₱{Number(loan.remaining_balance).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{loan.start_date || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "active" ? "secondary" : loan.status === "paid" ? "default" : "destructive"} className="text-[10px] font-semibold uppercase">
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{loan.remarks || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Loan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-extrabold">Add New Loan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Employee *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
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
              <div>
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Remarks</Label>
              <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Add Loan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
