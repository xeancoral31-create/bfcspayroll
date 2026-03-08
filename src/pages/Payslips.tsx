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
    if (!viewRecord) return;
    const ded = typeof viewRecord.deductions === "object" ? viewRecord.deductions : {};
    const dedItems = [
      { label: "SSS", value: Number(ded.sss || 0) },
      { label: "PhilHealth", value: Number(ded.philhealth || 0) },
      { label: "Pag-IBIG", value: Number(ded.pagibig || 0) },
      { label: "Withholding Tax", value: Number(ded.withholding_tax || 0) },
      { label: "Loan Deductions", value: Number(ded.loans || 0) },
      { label: "Other Deductions", value: Number(ded.other || 0) },
    ].filter(d => d.value > 0);

    const fmt = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dateStr = format(new Date(viewRecord.created_at), "MMMM d, yyyy");

    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title>Payslip — ${viewRecord.employees?.first_name} ${viewRecord.employees?.last_name}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans', sans-serif; color: #1a1e2e; font-size: 12px; line-height: 1.5; background: #fff; }
  .page { max-width: 680px; margin: 0 auto; padding: 40px 48px; }
  .mono { font-family: 'IBM Plex Mono', monospace; }

  /* Header */
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 20px; border-bottom: 3px solid #1a5fb4; margin-bottom: 24px; }
  .header-logo { width: 64px; height: 64px; object-fit: contain; }
  .header-text h1 { font-size: 18px; font-weight: 700; color: #1a5fb4; letter-spacing: -0.3px; }
  .header-text p { font-size: 11px; color: #666; line-height: 1.4; }
  .doc-title { text-align: center; margin-bottom: 24px; }
  .doc-title h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #1a5fb4; background: #eef3fb; display: inline-block; padding: 6px 24px; border-radius: 4px; }

  /* Employee Info Grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 32px; margin-bottom: 24px; padding: 16px 20px; background: #f8f9fb; border-radius: 8px; border: 1px solid #e8ecf1; }
  .info-item { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; }
  .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #888; font-weight: 600; }
  .info-value { font-size: 12px; font-weight: 600; color: #1a1e2e; text-align: right; }

  /* Tables */
  .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a5fb4; margin-bottom: 8px; padding-left: 2px; }
  .section-label.orange { color: #c65d12; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #555; padding: 8px 12px; border-bottom: 2px solid #dde2ea; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #eef0f4; font-size: 12px; }
  td.amount { text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 500; }
  tr.subtotal td { border-top: 2px solid #1a5fb4; font-weight: 700; font-size: 13px; background: #f0f4fa; }
  tr.subtotal-ded td { border-top: 2px solid #c65d12; font-weight: 700; font-size: 13px; background: #fef6f0; color: #c65d12; }

  /* Net Pay Box */
  .net-pay-box { background: linear-gradient(135deg, #1a5fb4, #1449a0); color: #fff; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
  .net-pay-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.85; font-weight: 600; }
  .net-pay-amount { font-size: 32px; font-weight: 800; font-family: 'IBM Plex Mono', monospace; margin-top: 4px; letter-spacing: -0.5px; }

  /* Signatures */
  .signatures { display: flex; justify-content: space-between; margin-top: 48px; padding: 0 16px; }
  .sig-block { text-align: center; width: 200px; }
  .sig-line { border-top: 1.5px solid #333; margin-bottom: 6px; }
  .sig-name { font-size: 11px; font-weight: 600; }
  .sig-title { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Footer */
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; }
  .footer p { font-size: 9px; color: #aaa; line-height: 1.6; }
  .footer .confidential { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #c65d12; font-weight: 600; margin-top: 8px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 24px 32px; }
    @page { margin: 0.5in; size: letter; }
  }
</style></head><body>
<div class="page">
  <div class="header">
    <img src="${window.location.origin}/placeholder.svg" class="header-logo" alt="BFCS Logo" onerror="this.style.display='none'" />
    <div class="header-text">
      <h1>Butuan Faith Christian School</h1>
      <p>Butuan City, Agusan del Norte, Philippines<br/>Finance & Payroll Department</p>
    </div>
  </div>

  <div class="doc-title">
    <h2>Employee Payslip</h2>
  </div>

  <div class="info-grid">
    <div class="info-item"><span class="info-label">Employee Name</span><span class="info-value">${viewRecord.employees?.first_name} ${viewRecord.employees?.last_name}</span></div>
    <div class="info-item"><span class="info-label">Employee ID</span><span class="info-value mono">${viewRecord.employees?.employee_id}</span></div>
    <div class="info-item"><span class="info-label">Position</span><span class="info-value">${viewRecord.employees?.position || "—"}</span></div>
    <div class="info-item"><span class="info-label">Department</span><span class="info-value">${viewRecord.employees?.department || "—"}</span></div>
    <div class="info-item"><span class="info-label">Pay Period</span><span class="info-value">${viewRecord.period}</span></div>
    <div class="info-item"><span class="info-label">Date Issued</span><span class="info-value">${dateStr}</span></div>
  </div>

  <div class="section-label">Earnings</div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Basic Salary</td><td class="amount">${fmt(Number(viewRecord.basic_salary))}</td></tr>
      <tr><td>Overtime Pay</td><td class="amount">${fmt(Number(viewRecord.overtime))}</td></tr>
      <tr><td>Allowances</td><td class="amount">${fmt(Number(viewRecord.allowances))}</td></tr>
      <tr class="subtotal"><td>Gross Pay</td><td class="amount">${fmt(Number(viewRecord.gross_pay))}</td></tr>
    </tbody>
  </table>

  <div class="section-label orange">Deductions</div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${dedItems.map(d => `<tr><td>${d.label}</td><td class="amount">${fmt(d.value)}</td></tr>`).join("")}
      <tr class="subtotal-ded"><td>Total Deductions</td><td class="amount">-${fmt(Number(viewRecord.total_deductions))}</td></tr>
    </tbody>
  </table>

  <div class="net-pay-box">
    <div class="net-pay-label">Net Pay</div>
    <div class="net-pay-amount">${fmt(Number(viewRecord.net_pay))}</div>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">${viewRecord.employees?.first_name} ${viewRecord.employees?.last_name}</div>
      <div class="sig-title">Employee</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">Finance Officer</div>
      <div class="sig-title">Authorized Signatory</div>
    </div>
  </div>

  <div class="footer">
    <p>This payslip was generated by the BFCS Payroll System on ${dateStr}.<br/>For questions or discrepancies, please contact the Finance Office.</p>
    <p class="confidential">Confidential — For Authorized Personnel Only</p>
  </div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const deductions = viewRecord ? (typeof viewRecord.deductions === "object" ? viewRecord.deductions : {}) : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Payslip Records</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View, edit, print, and manage employee pay receipts.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-semibold px-3 py-1.5 self-start">
          {records?.length || 0} records
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-3.5">Employee</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Period</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Gross Pay</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Deductions</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Net Pay</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <div className="h-8 w-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </TableCell></TableRow>
              ) : records?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-sm font-medium">No payslips available</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Process a payroll first to generate payslips</p>
                </TableCell></TableRow>
              ) : (
                records?.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                          {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{r.employees?.first_name} {r.employees?.last_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{r.employees?.employee_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{r.period}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-foreground">₱{Number(r.gross_pay).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent">-₱{Number(r.total_deductions).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-primary">₱{Number(r.net_pay).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-semibold uppercase gap-1.5 px-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setViewRecord(r)} title="View Payslip">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(r)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {records && records.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <p className="text-[11px] text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{records.length}</span> payslip records
              </p>
            </div>
          )}
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
