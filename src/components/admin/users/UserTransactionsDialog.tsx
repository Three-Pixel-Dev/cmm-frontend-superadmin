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
import type { ApiTransaction } from "@/lib/admin/types";
import { fmtVks } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const UserTransactionsDialog = ({
  userId,
  userLabel,
  open,
  onClose,
}: {
  userId: string;
  userLabel?: string;
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
          {userLabel && <p className="text-sm text-muted-foreground">{userLabel}</p>}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <TransactionsPanel userId={userId} ledger="real" enabled={open} />
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

function TransactionsPanel({
  userId,
  ledger,
  enabled,
}: {
  userId: string;
  ledger: "real" | "virtual";
  enabled: boolean;
}) {
  const txQ = useQuery({
    queryKey: ["admin", "user-transactions", ledger, userId],
    queryFn: () =>
      ledger === "real"
        ? transactionsApi.listRealByUser(userId)
        : transactionsApi.listVirtualByUser(userId),
    enabled,
  });

  if (txQ.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (txQ.isError) {
    return (
      <div className="text-center text-sm text-destructive py-8">
        {(txQ.error as Error).message || "Failed to load transactions."}
      </div>
    );
  }

  const items = txQ.data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No {ledger} transactions found for this user.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[50vh] pr-4 border rounded-md">
      <TransactionsTable items={items} showDirection={ledger === "real"} />
    </ScrollArea>
  );
}

function TransactionsTable({
  items,
  showDirection,
}: {
  items: ApiTransaction[];
  showDirection: boolean;
}) {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
        <TableRow>
          <TableHead>Type</TableHead>
          {showDirection && <TableHead>Direction</TableHead>}
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((txn) => (
          <TableRow key={txn.id}>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {txn.type ?? "—"}
              </Badge>
            </TableCell>
            {showDirection && (
              <TableCell>
                <Badge
                  variant={txn.tran_type === "credit" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {txn.tran_type ?? "—"}
                </Badge>
              </TableCell>
            )}
            <TableCell className="text-right font-mono font-medium">
              {fmtVks(Number(txn.amount))}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="uppercase">
                {txn.source_type ?? "—"}
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
  );
}
