import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { marketItemsApi } from "@/lib/admin/api";
import { MarketItem } from "@/types/market";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const CancelMarketItemDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: MarketItem;
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => marketItemsApi.cancel(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["settlement-status", initial.id] });
      onClose();
      toast.success("Market item cancelled — refunding bets in background");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not cancel market item");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel market item</DialogTitle>
          <DialogDescription>
            Cancel &quot;{initial.title_en}&quot;? Bets will not be settled on this item. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Keep open
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={() => mutate()}>
            Cancel market item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
