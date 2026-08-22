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
import { marketItemsApi } from "@/lib/admin/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const BettingHistoriesDialog = ({
  userId,
  open,
  onClose,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: histories, isPending } = useQuery({
    queryKey: ["betting-histories", "user-id", userId],
    queryFn: async () => {
      const result = await marketItemsApi.history({
        page: 1,
        limit: 200,
        user_id: userId,
      });
      return result.items;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Orders History</DialogTitle>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 min-h-[300px] flex flex-col justify-center overflow-hidden my-4">
          {isPending ? (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading histories...</p>
            </div>
          ) : !histories || histories.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No betting history found for this item.
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Amount (vK)</TableHead>
                    <TableHead>Ledger</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histories.map((history) => (
                    <TableRow key={history.id}>
                      {/* Side (Yes/No) */}
                      <TableCell>
                        <Badge
                          variant={history.side === "yes" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {history.side}
                        </Badge>
                      </TableCell>

                      {/* Shares */}
                      <TableCell className="text-right font-mono">
                        {history.shares.toLocaleString()}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right font-mono font-medium">
                        {history.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>

                      {/* Ledger */}
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {history.ledger}
                        </Badge>
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(history.created_at).toLocaleDateString(undefined, {
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
