import { useState } from "react";
import { useEmployees, usePayrollActions } from "@/hooks/usePayrollData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface EmployeeForm {
  first_name: string;
  last_name: string;
  position: string;
  basic_salary: string;
  date_hired: string;
  email: string;
  contact_number: string;
  status: string;
}

const emptyForm: EmployeeForm = {
  first_name: "", last_name: "", position: "Cashier",
  basic_salary: "", date_hired: "", email: "", contact_number: "", status: "active",
};

const positions = ["Principal", "Janitor", "Teacher", "Cashier", "Administrator", "Maintenance"];
const statuses = ["active", "inactive"];

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { addEmployee, updateEmployee, deleteEmployee } = usePayrollActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = employees?.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = filterPosition === "all" || e.position === filterPosition;
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (e: any) => {
    setEditId(e.id);
    setForm({
      first_name: e.first_name, last_name: e.last_name,
      position: e.position || "Cashier",
      basic_salary: String(e.basic_salary), date_hired: e.date_hired || "",
      email: e.email || "", contact_number: e.contact_number || "",
      status: e.status || "active",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.basic_salary) {
      toast.error("Please fill in all required fields."); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateEmployee(editId, {
          first_name: form.first_name, last_name: form.last_name,
          position: form.position, basic_salary: parseFloat(form.basic_salary),
          email: form.email || null, contact_number: form.contact_number || null,
          date_hired: form.date_hired || null, status: form.status,
        });
      } else {
        const autoId = `EMP-${Date.now().toString(36).toUpperCase()}`;
        await addEmployee({
          employee_id: autoId, first_name: form.first_name, last_name: form.last_name,
          position: form.position, basic_salary: parseFloat(form.basic_salary),
          email: form.email || undefined, contact_number: form.contact_number || undefined,
          date_hired: form.date_hired || undefined, status: form.status,
        });
      }
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await deleteEmployee(deleteId); } catch (err: any) { toast.error(err.message); }
    setDeleteId(null);
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterPosition} onValueChange={setFilterPosition}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Position" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Position</TableHead>
                <TableHead className="text-right font-bold">Basic Salary</TableHead>
                <TableHead className="font-bold">Date Hired</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Contact</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No employees found</TableCell></TableRow>
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
                    <TableCell className="text-sm">{e.date_hired || "—"}</TableCell>
                    <TableCell className="text-sm">{e.email || "—"}</TableCell>
                    <TableCell className="text-sm">{e.contact_number || "—"}</TableCell>
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
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(e.id)}>
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
            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs font-semibold">Basic Salary (₱) *</Label>
                <Input type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Date Hired</Label><Input type="date" value={form.date_hired} onChange={(e) => setForm({ ...form, date_hired: e.target.value })} /></div>
              <div><Label className="text-xs font-semibold">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Contact</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Add Employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this employee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
