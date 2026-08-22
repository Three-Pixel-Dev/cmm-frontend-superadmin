import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { marketItemsApi } from "@/lib/admin/api";
import { ResolveMarketItemInput, resolveMarketItemSchema } from "@/schemas/market-item.schema";
import { MarketItem, MarketItemOption } from "@/types/market";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function resolveChoices(item: MarketItem): MarketItemOption[] {
  if (item.options && item.options.length > 0) {
    return [...item.options].sort((a, b) => a.sort_order - b.sort_order);
  }
  return [
    { id: "legacy-yes", title_en: "Yes", title_my: "ဟုတ်ကဲ့", sort_order: 0 },
    { id: "legacy-no", title_en: "No", title_my: "မဟုတ်ပါ", sort_order: 1 },
  ];
}

export const ResolveMarketItemDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: MarketItem;
  open: boolean;
  onClose: () => void;
}) => {
  const choices = resolveChoices(initial);
  const multiOption = choices.length > 2 && choices[0]?.id !== "legacy-yes";

  const form = useForm<ResolveMarketItemInput>({
    resolver: zodResolver(resolveMarketItemSchema),
    defaultValues: { winning_option_id: choices[0]?.id },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: ResolveMarketItemInput) => {
      return marketItemsApi.resolve(initial.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["settlement-status", initial.id] });
      form.reset({ winning_option_id: choices[0]?.id });
      onClose();
      toast.success("Market item resolved — settling bets in background");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not resolve market item");
    },
  });

  const onSubmit = (data: ResolveMarketItemInput) => {
    if (data.outcome === "void") {
      mutate({ outcome: "void" });
      return;
    }
    if (data.winning_option_id?.startsWith("legacy-")) {
      mutate({ outcome: data.winning_option_id === "legacy-yes" ? "yes" : "no" });
      return;
    }
    mutate({ winning_option_id: data.winning_option_id });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve market item</DialogTitle>
          <DialogDescription>
            Set the final outcome for &quot;{initial.title_en}&quot;. This cannot be changed after
            settlement.
          </DialogDescription>
        </DialogHeader>
        {multiOption && (
          <p className="text-sm text-muted-foreground rounded-md border border-border/60 px-3 py-2">
            This item has {choices.length} answers. Bets must use <code className="text-xs">option_id</code> when
            placing orders.
          </p>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            control={form.control}
            name="winning_option_id"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Winning answer</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {choices.map((o) => (
                    <Button
                      key={o.id}
                      type="button"
                      variant={field.value === o.id ? "default" : "outline"}
                      onClick={() => {
                        field.onChange(o.id);
                        form.setValue("outcome", undefined);
                      }}
                    >
                      {o.title_en}
                    </Button>
                  ))}
                </div>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="outcome"
            render={({ field }) => (
              <Field>
                <FieldLabel>Or void (refund all)</FieldLabel>
                <Button
                  type="button"
                  variant={field.value === "void" ? "default" : "outline"}
                  className={cn(field.value === "void" && "bg-muted-foreground")}
                  onClick={() => {
                    field.onChange("void");
                    form.setValue("winning_option_id", undefined);
                  }}
                >
                  Void
                </Button>
              </Field>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={isPending}>
              Confirm resolve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
