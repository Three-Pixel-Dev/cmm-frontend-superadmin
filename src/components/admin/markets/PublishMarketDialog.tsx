import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDraftMarketItems } from "@/lib/market";
import { marketsApi } from "@/lib/admin/api";
import { Market } from "@/types/market";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const PublishMarketDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: Market;
  open: boolean;
  onClose: () => void;
}) => {
  const draftCount = getDraftMarketItems(initial).length;
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => marketsApi.publish(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      onClose();
      toast.success("Market published — clients will see it live");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not publish market");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish market</DialogTitle>
          <DialogDescription>
            Publish &quot;{initial.title_en}&quot;? {draftCount} draft item
            {draftCount === 1 ? "" : "s"} will go live and subscribers will receive a realtime
            update.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Keep as draft
          </Button>
          <Button
            type="button"
            disabled={isPending || draftCount === 0}
            onClick={() => mutate()}
          >
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
