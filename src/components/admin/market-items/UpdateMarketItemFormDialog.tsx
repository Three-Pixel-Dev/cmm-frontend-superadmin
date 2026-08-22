import { DateTimePicker } from "@/components/DateTimePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MarketItemOptionsEditor } from "@/components/admin/markets/MarketItemOptionsEditor";
import { marketItemsApi } from "@/lib/admin/api";
import {
  buildMarketItemSeedUpdatePayload,
  impliedYesPercent,
  marketItemSeedEditable,
  optionsFromMarketItem,
} from "@/lib/market-pool";
import { UpdateMarketItemInput, updateMarketItemSchema } from "@/schemas/market-item.schema";
import { MarketItem } from "@/types/market";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface UpdateMarketItemArgs {
  id: string;
  payload: UpdateMarketItemInput;
}

function poolFromItem(item: MarketItem) {
  return item.real_pool ?? item.virtual_pool;
}

export const UpdateMarketItemFormDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: MarketItem;
  open: boolean;
  onClose: () => void;
}) => {
  const pool = poolFromItem(initial);
  const seedEditable = marketItemSeedEditable(initial);
  const itemOptions = useMemo(() => optionsFromMarketItem(initial), [initial]);

  const defaultValues = useMemo(
    () => ({
      title_en: initial.title_en,
      title_my: initial.title_my ?? "",
      resolution_criteria_en: initial.resolution_criteria_en ?? "",
      resolution_criteria_my: initial.resolution_criteria_my ?? "",
      slug: initial.slug,
      start_time: new Date(initial.start_time),
      close_time: new Date(initial.close_time),
      resolution_time: new Date(initial.resolution_time),
      status: initial.status,
      options: itemOptions,
      seed_retirement_threshold: pool?.seed_retirement_threshold ?? 0.8,
    }),
    [initial, pool, itemOptions],
  );

  const form = useForm<UpdateMarketItemInput>({
    resolver: zodResolver(updateMarketItemSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ id, payload }: UpdateMarketItemArgs) => {
      const result = await marketItemsApi.update(id, payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      onClose();
      toast.success("Market item updated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  const onSubmit = (data: UpdateMarketItemInput) => {
    const { dirtyFields } = form.formState;

    const payload: Partial<UpdateMarketItemInput> = {};

    const coreFields: Array<keyof UpdateMarketItemInput> = [
      "title_en",
      "title_my",
      "resolution_criteria_en",
      "resolution_criteria_my",
      "slug",
      "start_time",
      "close_time",
      "resolution_time",
      "status",
    ];

    coreFields.forEach((key) => {
      if (dirtyFields[key]) {
        const val = data[key];
        // eslint-disable-next-line
        payload[key] = val === "" ? undefined : (val as any);
      }
    });

    if (seedEditable && (dirtyFields.options || dirtyFields.seed_retirement_threshold)) {
      Object.assign(
        payload,
        buildMarketItemSeedUpdatePayload(
          data.options ?? [],
          data.seed_retirement_threshold ?? 0.8,
        ),
      );
    }

    if (Object.keys(payload).length === 0) {
      toast.error("No changes detected.");
      return;
    }

    mutate({ id: initial.id, payload });
  };

  const options = useWatch({ control: form.control, name: "options" }) ?? [];
  const first = Number(options[0]?.seed_count) || 0;
  const second = Number(options[1]?.seed_count) || 0;
  const yesPct = impliedYesPercent(first, second);
  const multiOption = options.length > 2;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Market Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            control={form.control}
            name="title_en"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Title (EN)</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="title_my"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Title (MY)</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="resolution_criteria_en"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Resolution Criteria (EN)</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="resolution_criteria_my"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Resolution Criteria (MY)</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="start_time"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Start Time</FieldLabel>
                <DateTimePicker value={field.value} onChange={field.onChange} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="close_time"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Close Time</FieldLabel>
                <DateTimePicker value={field.value} onChange={field.onChange} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="resolution_time"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Resolution Time</FieldLabel>
                <DateTimePicker value={field.value} onChange={field.onChange} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {seedEditable ? (
            <div className="space-y-4 rounded-lg border border-border/60 p-4 bg-muted/20">
              <p className="text-sm font-medium">Pool seed (draft/open, no bets yet)</p>
              <MarketItemOptionsEditor control={form.control} name="options" />
              <Controller
                control={form.control}
                name="seed_retirement_threshold"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Seed retirement threshold (0–1)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={field.value ?? 0.8}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
              {options.length >= 2 && !multiOption && (
                <p className="text-sm text-muted-foreground">
                  Initial Yes odds: <span className="font-semibold text-foreground">{yesPct}%</span>
                </p>
              )}
              {options.length >= 2 && multiOption && (
                <p className="text-sm text-muted-foreground">
                  {options.length} answers configured. Implied odds are shown per answer in the
                  editor.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              <p>
                Pool seed locked — editable only while draft/open with no real bets (threshold{" "}
                {Math.round((pool?.seed_retirement_threshold ?? 0.8) * 100)}%).
              </p>
              <ul className="space-y-1">
                {itemOptions.map((opt) => (
                  <li key={opt.id ?? opt.title_en} className="text-foreground">
                    {opt.title_en}: {opt.seed_count} seed shares
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
