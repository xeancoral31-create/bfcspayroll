import { useState } from "react";
import { useEmployees, usePayrollActions } from "@/hooks/usePayrollData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface EmployeeForm {
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  
  basic_salary: string;
  email: string;
  contact_number: string;
  date_hired: string;
}

const emptyForm: EmployeeForm = {
  employee_id: "", first_name: "", last_name: "", position: "Cashier",
  basic_salary: "", email: "", contact_number: "", date_hired: "",
};

const positions = ["Principal", "Janitor", "Teacher", "Cashier", "Administrator"];

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { addEmployee, updateEmployee, deleteEmployee } = usePayrollActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = employees?.filter((e) =>
    `${e.first_name} ${e.last_name} ${e.employee_id}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (e: any) => {
    setEditId(e.id);
    setForm({
      employee_id: e.employee_id, first_name: e.first_name, last_name: e.last_name,
      position: e.position || "Cashier",
      basic_salary: String(e.basic_salary), email: e.email || "", contact_number: e.contact_number || "",
      date_hired: e.date_hired || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.first_name || !form.last_name || !form.basic_salary) {
      toast.error("Please fill in all required fields."); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateEmployee(editId, {
          employee_id: form.employee_id, first_name: form.first_name, last_name: form.last_name,
          position: form.position, basic_salary: parseFloat(form.basic_salary),
          email: form.email || null, contact_number: form.contact_number || null, date_hired: form.date_hired || null,
        });
      } else {
        await addEmployee({
          employee_id: form.employee_id, first_name: form.first_name, last_name: form.last_name,
          position: form.position, basic_salary: parseFloat(form.basic_salary),
          email: form.email || undefined, contact_number: form.contact_number || undefined,
          date_hired: form.date_hired || undefined,
        });
      }
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this employee?")) return;
    try { await deleteEmployee(id); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Employees</h1>
            <p className="text-xs text-muted-foreground">{employees?.length || 0} employees registered</p>
          </div>
        </div>
        <Button onClick={openAdd} className="font-semibold">
          <Plus className="h-4 w-4 mr-1.5" /> Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Position</TableHead>
                <TableHead className="text-right font-bold">Basic Salary</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No employees found</TableCell></TableRow>
              ) : (
                filtered?.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {e.first_name[0]}{e.last_name[0]}
                        </div>
                        <span className="font-semibold text-sm">{e.first_name} {e.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{e.position}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-sm">₱{Number(e.basic_salary).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "active" ? "secondary" : "destructive"} className="text-[10px] font-semibold uppercase">
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-extrabold">{editId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs font-semibold">Employee ID *</Label><Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="EMP-001" /></div>
              <div><Label className="text-xs font-semibold">First Name *</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><Label className="text-xs font-semibold">Last Name *</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Position</Label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Role</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Basic Salary (₱) *</Label><Input type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} /></div>
              <div><Label className="text-xs font-semibold">Date Hired</Label><Input type="date" value={form.date_hired} onChange={(e) => setForm({ ...form, date_hired: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-xs font-semibold">Contact</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Add Employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
