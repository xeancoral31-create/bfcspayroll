import { useState, useRef } from "react";
import { usePayrollRecords } from "@/hooks/usePayrollData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Eye, Printer, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import bfcsLogo from "@/assets/bfcs-logo.png";

export default function Payslips() {
  const { data: records, isLoading } = usePayrollRecords();
  const queryClient = useQueryClient();
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [editOvertime, setEditOvertime] = useState("0");
  const [editAllowances, setEditAllowances] = useState("0");
  const [editSss, setEditSss] = useState("0");
  const [editPhilhealth, setEditPhilhealth] = useState("0");
  const [editPagibig, setEditPagibig] = useState("0");
  const [editTax, setEditTax] = useState("0");
  const [editOther, setEditOther] = useState("0");
  const [editPeriod, setEditPeriod] = useState("");

  const openEdit = (r: any) => {
    const ded = typeof r.deductions === "object" ? r.deductions : {};
    setEditRecord(r);
    setEditOvertime(String(r.overtime || 0));
    setEditAllowances(String(r.allowances || 0));
    setEditSss(String(ded.sss || 0));
    setEditPhilhealth(String(ded.philhealth || 0));
    setEditPagibig(String(ded.pagibig || 0));
    setEditTax(String(ded.withholding_tax || 0));
    setEditOther(String(ded.other || 0));
    setEditPeriod(r.period);
  };

  const handleUpdate = async () => {
    if (!editRecord) return;
    setSaving(true);
    try {
      const basicSalary = Number(editRecord.basic_salary);
      const overtime = Number(editOvertime || 0);
      const allowances = Number(editAllowances || 0);
      const grossPay = basicSalary + overtime + allowances;
      const ded = typeof editRecord.deductions === "object" ? editRecord.deductions : {};
      const loans = Number(ded.loans || 0);
      const deductions = {
        sss: Number(editSss || 0),
        philhealth: Number(editPhilhealth || 0),
        pagibig: Number(editPagibig || 0),
        withholding_tax: Number(editTax || 0),
        other: Number(editOther || 0),
        loans,
      };
      const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
      const netPay = grossPay - totalDeductions;

      const { error } = await supabase.from("payroll_records").update({
        overtime: Math.round(overtime * 100) / 100,
        allowances: Math.round(allowances * 100) / 100,
        gross_pay: Math.round(grossPay * 100) / 100,
        deductions: deductions as any,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        net_pay: Math.round(netPay * 100) / 100,
        period: editPeriod,
      }).eq("id", editRecord.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["payroll_records"] });
      toast.success("Payslip updated!");
      setEditRecord(null);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("payroll_records").delete().eq("id", deleteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["payroll_records"] });
      toast.success("Payslip deleted.");
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleteId(null);
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(`
      <html><head><title>Payslip - BFCS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1e2e; font-size: 13px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a5fb4; padding-bottom: 16px; }
        .header img { height: 60px; margin-bottom: 8px; }
        .header h1 { font-size: 16px; color: #1a5fb4; }
        .header p { font-size: 11px; color: #666; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a5fb4; margin: 16px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 12px; }
        th { background: #f5f5f8; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #444; }
        .text-right { text-align: right; }
        .net-pay { background: #1a5fb4; color: white; padding: 12px; border-radius: 8px; text-align: center; margin-top: 16px; }
        .net-pay .label { font-size: 11px; opacity: 0.8; }
        .net-pay .amount { font-size: 22px; font-weight: 800; }
        .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const deductions = viewRecord ? (typeof viewRecord.deductions === "object" ? viewRecord.deductions : {}) : {};

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Payslips</h1>
          <p className="text-xs text-muted-foreground">View, edit, and print employee pay receipts</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Employee</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Period</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Gross</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Deductions</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Net Pay</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
              ) : records?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No payslips available</TableCell></TableRow>
              ) : (
                records?.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.employees?.first_name} {r.employees?.last_name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.employees?.employee_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.period}</TableCell>
                    <TableCell className="text-right font-mono text-sm">₱{Number(r.gross_pay).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent">-₱{Number(r.total_deductions).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-primary">₱{Number(r.net_pay).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-semibold uppercase gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewRecord(r)} title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)} title="Delete">
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

      {/* View Receipt Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <FileText className="h-4 w-4 text-primary" /> Payslip Receipt
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <>
              <div ref={receiptRef} className="print-area">
                <div className="text-center border-b-2 border-primary pb-4 mb-4">
                  <img src={bfcsLogo} alt="BFCS" className="h-14 mx-auto mb-2" />
                  <h2 className="text-base font-bold text-primary">Butuan Faith Christian School</h2>
                  <p className="text-[11px] text-muted-foreground">Butuan City, Philippines</p>
                  <p className="text-xs font-bold mt-2 uppercase tracking-widest text-foreground">Payslip / Pay Receipt</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm mb-4">
                  <div><span className="text-muted-foreground text-xs">Employee:</span> <strong>{viewRecord.employees?.first_name} {viewRecord.employees?.last_name}</strong></div>
                  <div><span className="text-muted-foreground text-xs">ID:</span> <strong className="font-mono">{viewRecord.employees?.employee_id}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Position:</span> <strong>{viewRecord.employees?.position}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Department:</span> <strong>{viewRecord.employees?.department || "—"}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Pay Period:</span> <strong>{viewRecord.period}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Date:</span> <strong>{format(new Date(viewRecord.created_at), "MMM d, yyyy")}</strong></div>
                </div>
                <Separator className="my-3" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Earnings</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono font-semibold">₱{Number(viewRecord.basic_salary).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Overtime</span><span className="font-mono">₱{Number(viewRecord.overtime).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Allowances</span><span className="font-mono">₱{Number(viewRecord.allowances).toLocaleString()}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold"><span>Gross Pay</span><span className="font-mono">₱{Number(viewRecord.gross_pay).toLocaleString()}</span></div>
                </div>
                <Separator className="my-3" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-2">Deductions</p>
                <div className="space-y-1.5 text-sm">
                  {deductions.sss > 0 && <div className="flex justify-between"><span>SSS</span><span className="font-mono">₱{Number(deductions.sss).toLocaleString()}</span></div>}
                  {deductions.philhealth > 0 && <div className="flex justify-between"><span>PhilHealth</span><span className="font-mono">₱{Number(deductions.philhealth).toLocaleString()}</span></div>}
                  {deductions.pagibig > 0 && <div className="flex justify-between"><span>Pag-IBIG</span><span className="font-mono">₱{Number(deductions.pagibig).toLocaleString()}</span></div>}
                  {deductions.withholding_tax > 0 && <div className="flex justify-between"><span>Withholding Tax</span><span className="font-mono">₱{Number(deductions.withholding_tax).toLocaleString()}</span></div>}
                  {deductions.other > 0 && <div className="flex justify-between"><span>Other</span><span className="font-mono">₱{Number(deductions.other).toLocaleString()}</span></div>}
                  {deductions.loans > 0 && <div className="flex justify-between"><span>Loan Deductions</span><span className="font-mono">₱{Number(deductions.loans).toLocaleString()}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-accent"><span>Total Deductions</span><span className="font-mono">-₱{Number(viewRecord.total_deductions).toLocaleString()}</span></div>
                </div>
                <div className="mt-4 rounded-xl bg-primary p-4 text-center text-primary-foreground">
                  <p className="text-[11px] font-medium opacity-80 uppercase tracking-widest">Net Pay</p>
                  <p className="text-2xl font-bold font-mono mt-1">₱{Number(viewRecord.net_pay).toLocaleString()}</p>
                </div>
                <div className="flex justify-between mt-10 px-4">
                  <div className="text-center">
                    <div className="w-36 border-t border-foreground/40 mb-1" />
                    <p className="text-xs font-semibold">Employee Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-t border-foreground/40 mb-1" />
                    <p className="text-xs font-semibold">Authorized Signature</p>
                  </div>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-6">
                  This is a system-generated payslip from BFCS Payroll System. For inquiries, contact the Finance Office.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={handlePrint} className="flex-1 font-semibold gap-2">
                  <Printer className="h-4 w-4" /> Print Payslip
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={(open) => !open && setEditRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-bold">Edit Payslip</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 border">
                <p className="text-sm font-bold">{editRecord.employees?.first_name} {editRecord.employees?.last_name}</p>
                <p className="text-[11px] text-muted-foreground">{editRecord.employees?.position} • Basic: ₱{Number(editRecord.basic_salary).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold">Pay Period</Label>
                <Input value={editPeriod} onChange={(e) => setEditPeriod(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px] text-muted-foreground">Overtime (₱)</Label><Input type="number" value={editOvertime} onChange={(e) => setEditOvertime(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Allowances (₱)</Label><Input type="number" value={editAllowances} onChange={(e) => setEditAllowances(e.target.value)} min="0" /></div>
              </div>
              <Separator />
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Deductions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-[11px] text-muted-foreground">SSS</Label><Input type="number" value={editSss} onChange={(e) => setEditSss(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">PhilHealth</Label><Input type="number" value={editPhilhealth} onChange={(e) => setEditPhilhealth(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Pag-IBIG</Label><Input type="number" value={editPagibig} onChange={(e) => setEditPagibig(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Withholding Tax</Label><Input type="number" value={editTax} onChange={(e) => setEditTax(e.target.value)} min="0" /></div>
                <div><Label className="text-[11px] text-muted-foreground">Other</Label><Input type="number" value={editOther} onChange={(e) => setEditOther(e.target.value)} min="0" /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Update Payslip"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payslip</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this payslip record? This action cannot be undone.</AlertDialogDescription>
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
