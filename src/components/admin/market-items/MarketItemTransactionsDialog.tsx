import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { transactionsApi } from "@/lib/admin/api";
import { fmtVks } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const MarketItemTransactionsDialog = ({
  marketItemId,
  open,
  onClose,
}: {
  marketItemId: string;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: transactions, isPending } = useQuery({
    queryKey: ["market-item-transactions", marketItemId],
    queryFn: () => transactionsApi.listByMarketItem(marketItemId, { limit: 200 }),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-[300px] flex flex-col justify-center overflow-hidden my-4">
          {isPending ? (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No settlement transactions found for this item.
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Ledger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">{txn.user_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {txn.type ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={txn.tran_type === "credit" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {txn.tran_type ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {fmtVks(Number(txn.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {txn.ledger ?? "real"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {txn.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-auto">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
