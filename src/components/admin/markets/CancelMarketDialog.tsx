import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getActiveMarketItems } from "@/lib/market";
import { marketsApi } from "@/lib/admin/api";
import { Market } from "@/types/market";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const CancelMarketDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: Market;
  open: boolean;
  onClose: () => void;
}) => {
  const activeCount = getActiveMarketItems(initial).length;
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => marketsApi.cancel(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      for (const item of getActiveMarketItems(initial)) {
        queryClient.invalidateQueries({ queryKey: ["settlement-status", item.id] });
      }
      onClose();
      toast.success("Market cancelled — refunding bets in background");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not cancel market");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel market</DialogTitle>
          <DialogDescription>
            Cancel all {activeCount} open item{activeCount === 1 ? "" : "s"} in &quot;
            {initial.title_en}&quot;? Bets on those items will not be settled.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Keep open
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || activeCount === 0}
            onClick={() => mutate()}
          >
            Cancel market
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
