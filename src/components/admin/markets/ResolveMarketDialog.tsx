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
import { marketsApi } from "@/lib/admin/api";
import { getResolvableMarketItems } from "@/lib/market";
import { cn } from "@/lib/utils";
import { ResolveMarketInput, resolveMarketSchema } from "@/schemas/market.schema";
import { Market, MarketItem, MarketItemOption, MarketOutcome } from "@/types/market";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

const BINARY_OUTCOMES: { value: MarketOutcome; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "void", label: "Void" },
];

function resolveChoices(item: MarketItem): MarketItemOption[] {
  if (item.options && item.options.length > 0) {
    return [...item.options].sort((a, b) => a.sort_order - b.sort_order);
  }
  return [
    { id: "legacy-yes", title_en: "Yes", title_my: "ဟုတ်ကဲ့", sort_order: 0 },
    { id: "legacy-no", title_en: "No", title_my: "မဟုတ်ပါ", sort_order: 1 },
  ];
}

function isMultiOptionItem(item: MarketItem): boolean {
  const choices = resolveChoices(item);
  return choices.length > 2 && choices[0]?.id !== "legacy-yes";
}

function defaultItemEntry(item: MarketItem) {
  const choices = resolveChoices(item);
  if (isMultiOptionItem(item)) {
    return { market_item_id: item.id, winning_option_id: choices[0]?.id };
  }
  return { market_item_id: item.id, outcome: "yes" as MarketOutcome };
}

function defaultItems(market: Market) {
  return getResolvableMarketItems(market).map(defaultItemEntry);
}

function toApiPayload(data: ResolveMarketInput): ResolveMarketInput {
  return {
    items: data.items.map((item) => {
      if (item.outcome === "void") {
        return { market_item_id: item.market_item_id, outcome: "void" as const };
      }
      if (item.winning_option_id) {
        return {
          market_item_id: item.market_item_id,
          winning_option_id: item.winning_option_id,
        };
      }
      return {
        market_item_id: item.market_item_id,
        outcome: item.outcome ?? "yes",
      };
    }),
  };
}

export const ResolveMarketDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: Market;
  open: boolean;
  onClose: () => void;
}) => {
  const activeItems = useMemo(() => getResolvableMarketItems(initial), [initial]);

  const form = useForm<ResolveMarketInput>({
    resolver: zodResolver(resolveMarketSchema),
    defaultValues: { items: defaultItems(initial) },
  });

  const { fields } = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    if (open) {
      form.reset({ items: defaultItems(initial) });
    }
  }, [open, initial, form]);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: ResolveMarketInput) =>
      marketsApi.resolve(initial.id, toApiPayload(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      for (const entry of form.getValues("items")) {
        queryClient.invalidateQueries({ queryKey: ["settlement-status", entry.market_item_id] });
      }
      onClose();
      toast.success("Market resolved — settling bets in background");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not resolve market");
    },
  });

  const itemByFieldIndex = useMemo(() => {
    return fields.map((_, index) => {
      const itemId = form.getValues(`items.${index}.market_item_id`);
      return activeItems.find((item) => item.id === itemId);
    });
  }, [fields, activeItems, form]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve market</DialogTitle>
          <DialogDescription>
            Set an outcome for each open item in &quot;{initial.title_en}&quot;.
          </DialogDescription>
        </DialogHeader>
        {activeItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open items to resolve.</p>
        ) : (
          <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
            {fields.map((field, index) => {
              const item = itemByFieldIndex[index];
              if (!item) return null;
              const multi = isMultiOptionItem(item);
              const choices = resolveChoices(item);

              if (multi) {
                return (
                  <div key={field.id} className="space-y-3 rounded-lg border border-border/60 p-3">
                    <p className="text-sm font-medium">{item.title_en}</p>
                    <Controller
                      control={form.control}
                      name={`items.${index}.winning_option_id`}
                      render={({ field: optionField, fieldState }) => (
                        <Field>
                          <FieldLabel>Winning answer</FieldLabel>
                          <div className="flex flex-wrap gap-2">
                            {choices.map((o) => (
                              <Button
                                key={o.id}
                                type="button"
                                variant={optionField.value === o.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  optionField.onChange(o.id);
                                  form.setValue(`items.${index}.outcome`, undefined);
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
                      name={`items.${index}.outcome`}
                      render={({ field: outcomeField }) => (
                        <Field>
                          <FieldLabel>Or void (refund all)</FieldLabel>
                          <Button
                            type="button"
                            variant={outcomeField.value === "void" ? "default" : "outline"}
                            size="sm"
                            className={cn(outcomeField.value === "void" && "bg-muted-foreground")}
                            onClick={() => {
                              outcomeField.onChange("void");
                              form.setValue(`items.${index}.winning_option_id`, undefined);
                            }}
                          >
                            Void
                          </Button>
                        </Field>
                      )}
                    />
                  </div>
                );
              }

              return (
                <Controller
                  key={field.id}
                  control={form.control}
                  name={`items.${index}.outcome`}
                  render={({ field: outcomeField, fieldState }) => (
                    <Field>
                      <FieldLabel>{item.title_en}</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {BINARY_OUTCOMES.map((o) => (
                          <Button
                            key={o.value}
                            type="button"
                            variant={outcomeField.value === o.value ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              o.value === "yes" &&
                                outcomeField.value === o.value &&
                                "bg-emerald-600 hover:bg-emerald-600",
                              o.value === "no" &&
                                outcomeField.value === o.value &&
                                "bg-red-600 hover:bg-red-600",
                            )}
                            onClick={() => {
                              outcomeField.onChange(o.value);
                              form.setValue(`items.${index}.winning_option_id`, undefined);
                            }}
                          >
                            {o.label}
                          </Button>
                        ))}
                      </div>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
              );
            })}
            {form.formState.errors.items?.message && (
              <p className="text-sm text-destructive">{String(form.formState.errors.items.message)}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" disabled={isPending}>
                Resolve all items
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
