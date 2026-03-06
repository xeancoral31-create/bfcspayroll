import { useState } from "react";
import { useEmployees } from "@/hooks/usePayrollData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { Employee } from "@/types/payroll";
import { toast } from "sonner";

const departments = ["Administration", "Academics", "Finance", "Maintenance"];
const fmt = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const emptyForm: Omit<Employee, "id"> = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  position: "",
  department: "Academics",
  basicSalary: 0,
  dateHired: new Date().toISOString().slice(0, 10),
  status: "active",
};

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName} ${e.employeeId} ${e.position}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, employeeId: `EMP-${String(employees.length + 1).padStart(3, "0")}` });
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditId(e.id);
    setForm({ ...e });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.position || form.basicSalary <= 0) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editId) {
      updateEmployee(editId, form);
      toast.success("Employee updated");
    } else {
      addEmployee(form);
      toast.success("Employee added");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    toast.success("Employee removed");
  };

  const updateField = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">{employees.length} total employees</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Employee ID</Label>
                  <Input value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date Hired</Label>
                  <Input type="date" value={form.dateHired} onChange={(e) => updateField("dateHired", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Position *</Label>
                  <Input value={form.position} onChange={(e) => updateField("position", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => updateField("department", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Basic Salary *</Label>
                  <Input type="number" value={form.basicSalary || ""} onChange={(e) => updateField("basicSalary", Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="mt-2">{editId ? "Update" : "Add"} Employee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.employeeId}</TableCell>
                  <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
                  <TableCell>{e.position}</TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(e.basicSalary)}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "active" ? "default" : "secondary"} className={e.status === "active" ? "bg-success text-success-foreground" : ""}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No employees found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
