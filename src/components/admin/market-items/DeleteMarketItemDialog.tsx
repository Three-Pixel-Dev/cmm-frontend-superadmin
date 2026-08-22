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

interface DeleteMarketItemArgs {
  id: string;
}

export const DeleteMarketItemDialog = ({
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
    mutationFn: async ({ id }: DeleteMarketItemArgs) => {
      const result = await marketItemsApi.delete(id);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      onClose();
      toast.success("Market item deleted");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const onSubmit = () => {
    mutate({ id: initial.id });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure want to delete market item?</DialogTitle>
          <DialogDescription>You are about to delete "{initial.title_en}"</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={"destructive"} disabled={isPending} onClick={onSubmit}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
