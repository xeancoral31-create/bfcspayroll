import { useState } from "react";
import { useEmployees, usePayrollActions } from "@/hooks/usePayrollData";
import { useLoans } from "@/pages/Loans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Pencil, Trash2, Search, Landmark, Download, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";

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
const departments = ["Administration", "Academic", "Finance", "Maintenance", "Other"];
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
  const [viewLoanId, setViewLoanId] = useState<string | null>(null);
  const { data: allLoans } = useLoans();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = employees?.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name} ${e.employee_id}`.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = filterPosition === "all" || e.position === filterPosition;
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  const activeCount = employees?.filter(e => e.status === "active").length || 0;
  const inactiveCount = (employees?.length || 0) - activeCount;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (e: any) => {
    setEditId(e.id);
    setForm({
      first_name: e.first_name, last_name: e.last_name,
      position: e.position || "Cashier", department: e.department || "",
      basic_salary: String(e.basic_salary), date_hired: e.date_hired || "",
      email: e.email || "", contact_number: e.contact_number || "",
      status: e.status || "active",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.basic_salary) {
      toast.error("Please fill in all required fields (First Name, Last Name, Basic Salary)."); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateEmployee(editId, {
          first_name: form.first_name, last_name: form.last_name,
          position: form.position, department: form.department || null,
          basic_salary: parseFloat(form.basic_salary),
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
        await createNotification(
          "New Employee Added",
          `${form.first_name} ${form.last_name} has been added as ${form.position}.`,
          "info"
        );
      }
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await deleteEmployee(deleteId); } catch (err: any) { toast.error(err.message); }
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) return;
    const headers = ["Employee ID", "First Name", "Last Name", "Position", "Department", "Basic Salary", "Status", "Date Hired", "Email", "Contact"];
    const rows = filtered.map(e => [
      e.employee_id, e.first_name, e.last_name, e.position || "", e.department || "",
      Number(e.basic_salary).toFixed(2), e.status, e.date_hired || "", e.email || "", e.contact_number || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bfcs-employees-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Employee list exported!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your workforce records and information.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-2 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-primary/15">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-primary/8 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-foreground">{employees?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/15">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-success/8 p-2.5">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-foreground">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/15">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-muted p-2.5">
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-foreground">{inactiveCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Inactive</p>
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
              <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || filterPosition !== "all" || filterStatus !== "all") && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setSearch(""); setFilterPosition("all"); setFilterStatus("all"); }}>
                Clear filters
              </Button>
            )}
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
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Position</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Basic Salary</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Date Hired</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground hidden xl:table-cell">Contact</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm">Loading employees...</p>
                  </div>
                </TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 text-muted-foreground/20" />
                    <p className="text-sm font-medium">No employees found</p>
                    <p className="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
                  </div>
                </TableCell></TableRow>
              ) : (
                filtered?.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                          {e.first_name[0]}{e.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{e.first_name} {e.last_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{e.employee_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{e.position}</p>
                      <p className="text-[10px] text-muted-foreground">{e.department || "—"}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-sm text-foreground">₱{Number(e.basic_salary).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{e.date_hired || "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <p className="text-xs text-muted-foreground">{e.email || "—"}</p>
                      <p className="text-[10px] text-muted-foreground/60">{e.contact_number || ""}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={e.status === "active" ? "secondary" : "destructive"}
                        className="text-[10px] font-semibold uppercase gap-1.5 px-2.5"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${e.status === "active" ? "bg-success" : "bg-destructive"}`} />
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setViewLoanId(e.id)} title="View Loans">
                          <Landmark className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(e)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteId(e.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filtered && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <p className="text-[11px] text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {employees?.length || 0} employees
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editId ? "Update the employee information below." : "Fill in the details to register a new employee."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">First Name <span className="text-destructive">*</span></Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Juan" /></div>
              <div><Label className="text-xs font-semibold">Last Name <span className="text-destructive">*</span></Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Dela Cruz" /></div>
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
                <Label className="text-xs font-semibold">Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Basic Salary (₱) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} placeholder="15000" />
              </div>
              <div><Label className="text-xs font-semibold">Date Hired</Label><Input type="date" value={form.date_hired} onChange={(e) => setForm({ ...form, date_hired: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan@bfcs.edu.ph" /></div>
              <div><Label className="text-xs font-semibold">Contact Number</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} placeholder="09XX-XXX-XXXX" /></div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">{saving ? "Saving..." : editId ? "Update Employee" : "Add Employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this employee? This action is permanent and cannot be undone. All associated payroll records will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loan Summary Dialog */}
      <Dialog open={!!viewLoanId} onOpenChange={(open) => !open && setViewLoanId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Landmark className="h-4 w-4 text-primary" /> Employee Loans
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const emp = employees?.find((e) => e.id === viewLoanId);
            const empLoans = (allLoans || []).filter((l: any) => l.employee_id === viewLoanId && l.status === "active");
            const totalOutstanding = empLoans.reduce((s: number, l: any) => s + Number(l.remaining_balance), 0);
            return (
              <div className="space-y-3">
                {emp && (
                  <div className="rounded-xl bg-muted/40 p-4 border">
                    <p className="text-sm font-bold text-foreground">{emp.first_name} {emp.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.position} · {emp.employee_id}</p>
                  </div>
                )}
                {empLoans.length === 0 ? (
                  <div className="text-center py-8">
                    <Landmark className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">No active loans</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {empLoans.map((loan: any) => (
                      <div key={loan.id} className="flex justify-between items-center text-sm rounded-xl bg-card px-4 py-3 border">
                        <div>
                          <p className="font-semibold text-foreground">{loan.loan_type} Loan</p>
                          <p className="text-[11px] text-muted-foreground">₱{Number(loan.monthly_deduction).toLocaleString()}/mo</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-accent">₱{Number(loan.remaining_balance).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">of ₱{Number(loan.amount).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-sm px-1">
                      <span>Total Outstanding</span>
                      <span className="font-mono text-accent">₱{totalOutstanding.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
