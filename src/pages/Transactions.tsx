import { useTransactions } from "@/hooks/usePOS";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { format } from "date-fns";

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();

  const todayTotal = transactions
    ?.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + Number(t.total), 0) || 0;

  const todayCount = transactions
    ?.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString())
    .length || 0;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" /> Transactions
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Today's Sales</p>
            <p className="text-2xl font-bold text-foreground">₱{todayTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Today's Transactions</p>
            <p className="text-2xl font-bold text-foreground">{todayCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions yet</TableCell></TableRow>
              ) : (
                transactions?.map((t) => {
                  const items = (t.items as any[]) || [];
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{format(new Date(t.created_at), "MMM d, h:mm a")}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {items.map((i: any) => `${i.name} x${i.quantity}`).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{t.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">₱{Number(t.total).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₱{Number(t.amount_paid).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₱{Number(t.change_amount).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
