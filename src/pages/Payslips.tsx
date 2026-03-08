import { useState, useRef } from "react";
import { usePayrollRecords } from "@/hooks/usePayrollData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Eye, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import bfcsLogo from "@/assets/bfcs-logo.png";

export default function Payslips() {
  const { data: records, isLoading } = usePayrollRecords();
  const [viewRecord, setViewRecord] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(`
      <html><head><title>Payslip - BFCS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1a2e; font-size: 13px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2537a0; padding-bottom: 16px; }
        .header img { height: 60px; margin-bottom: 8px; }
        .header h1 { font-size: 16px; color: #2537a0; }
        .header p { font-size: 11px; color: #666; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2537a0; margin: 16px 0 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .info-grid .label { font-size: 11px; color: #666; }
        .info-grid .value { font-size: 12px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 12px; }
        th { background: #f5f5f8; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #444; }
        .text-right { text-align: right; }
        .total-row { font-weight: 800; font-size: 14px; }
        .net-pay { background: #2537a0; color: white; padding: 12px; border-radius: 8px; text-align: center; margin-top: 16px; }
        .net-pay .label { font-size: 11px; opacity: 0.8; }
        .net-pay .amount { font-size: 22px; font-weight: 800; }
        .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
        .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-line { text-align: center; width: 180px; }
        .signature-line .line { border-top: 1px solid #333; margin-bottom: 4px; }
        .signature-line .name { font-size: 11px; font-weight: 600; }
        .signature-line .title { font-size: 10px; color: #666; }
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
        <div className="rounded-xl bg-primary/10 p-2.5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">Payslips</h1>
          <p className="text-xs text-muted-foreground">View and print employee pay receipts</p>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-bold">Employee</TableHead>
                <TableHead className="font-bold">Period</TableHead>
                <TableHead className="text-right font-bold">Gross</TableHead>
                <TableHead className="text-right font-bold">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Pay</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="w-16"></TableHead>
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
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
                    <TableCell className="text-right font-mono text-sm text-destructive">-₱{Number(r.total_deductions).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-success">₱{Number(r.net_pay).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-semibold uppercase">{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewRecord(r)} title="View Payslip">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold">
              <FileText className="h-4 w-4 text-primary" /> Payslip Receipt
            </DialogTitle>
          </DialogHeader>

          {viewRecord && (
            <>
              <div ref={receiptRef} className="print-area">
                {/* Receipt Header */}
                <div className="text-center border-b-2 border-primary pb-4 mb-4">
                  <img src={bfcsLogo} alt="BFCS" className="h-14 mx-auto mb-2" />
                  <h2 className="text-base font-extrabold text-primary">Butuan Faith Christian School</h2>
                  <p className="text-[11px] text-muted-foreground">Butuan City, Philippines</p>
                  <p className="text-xs font-bold mt-2 uppercase tracking-widest text-foreground">Payslip / Pay Receipt</p>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
                  <div><span className="text-muted-foreground text-xs">Employee:</span> <strong>{viewRecord.employees?.first_name} {viewRecord.employees?.last_name}</strong></div>
                  <div><span className="text-muted-foreground text-xs">ID:</span> <strong className="font-mono">{viewRecord.employees?.employee_id}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Position:</span> <strong>{viewRecord.employees?.position}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Department:</span> <strong>{viewRecord.employees?.department}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Pay Period:</span> <strong>{viewRecord.period}</strong></div>
                  <div><span className="text-muted-foreground text-xs">Date:</span> <strong>{format(new Date(viewRecord.created_at), "MMM d, yyyy")}</strong></div>
                </div>

                <Separator className="my-3" />

                {/* Earnings */}
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Earnings</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono font-semibold">₱{Number(viewRecord.basic_salary).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Overtime</span><span className="font-mono">₱{Number(viewRecord.overtime).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Allowances</span><span className="font-mono">₱{Number(viewRecord.allowances).toLocaleString()}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold"><span>Gross Pay</span><span className="font-mono">₱{Number(viewRecord.gross_pay).toLocaleString()}</span></div>
                </div>

                <Separator className="my-3" />

                {/* Deductions */}
                <p className="text-[11px] font-bold uppercase tracking-widest text-destructive mb-2">Deductions</p>
                <div className="space-y-1 text-sm">
                  {deductions.sss > 0 && <div className="flex justify-between"><span>SSS</span><span className="font-mono">₱{Number(deductions.sss).toLocaleString()}</span></div>}
                  {deductions.philhealth > 0 && <div className="flex justify-between"><span>PhilHealth</span><span className="font-mono">₱{Number(deductions.philhealth).toLocaleString()}</span></div>}
                  {deductions.pagibig > 0 && <div className="flex justify-between"><span>Pag-IBIG</span><span className="font-mono">₱{Number(deductions.pagibig).toLocaleString()}</span></div>}
                  {deductions.withholding_tax > 0 && <div className="flex justify-between"><span>Withholding Tax</span><span className="font-mono">₱{Number(deductions.withholding_tax).toLocaleString()}</span></div>}
                  {deductions.other > 0 && <div className="flex justify-between"><span>Other</span><span className="font-mono">₱{Number(deductions.other).toLocaleString()}</span></div>}
                  {deductions.loans > 0 && <div className="flex justify-between"><span>Loan Deductions</span><span className="font-mono">₱{Number(deductions.loans).toLocaleString()}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-destructive"><span>Total Deductions</span><span className="font-mono">-₱{Number(viewRecord.total_deductions).toLocaleString()}</span></div>
                </div>

                {/* Net Pay */}
                <div className="mt-4 rounded-xl bg-primary p-4 text-center text-primary-foreground">
                  <p className="text-[11px] font-medium opacity-80 uppercase tracking-widest">Net Pay</p>
                  <p className="text-2xl font-extrabold font-mono mt-1">₱{Number(viewRecord.net_pay).toLocaleString()}</p>
                </div>

                {/* Signatures */}
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
                <Button onClick={handlePrint} className="flex-1 font-semibold">
                  <Printer className="h-4 w-4 mr-2" /> Print Payslip
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
