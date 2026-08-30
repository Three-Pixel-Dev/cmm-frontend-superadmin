import { DateTimePicker } from "@/components/DateTimePicker";
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
import { Input } from "@/components/ui/input";
import {
  defaultMarketItemOptions,
  MarketItemOptionsEditor,
} from "@/components/admin/markets/MarketItemOptionsEditor";
import { marketItemsApi } from "@/lib/admin/api";
import { impliedYesPercent } from "@/lib/market-pool";
import { CreateMarketItemInput, createMarketItemSchema } from "@/schemas/market-item.schema";
import { Market } from "@/types/market";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

export const CreateMarketItemFormDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: Market;
  open: boolean;
  onClose: () => void;
}) => {
  const form = useForm({
    resolver: zodResolver(createMarketItemSchema),
    defaultValues: {
      market_id: initial.id,
      title_en: "",
      title_my: "",
      resolution_criteria_en: "",
      resolution_criteria_my: "",
      slug: "",
      start_time: new Date(),
      close_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolution_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      one_share_price: 5000,
      platform_fee_percentage: 5,
      options: defaultMarketItemOptions(),
      seed_retirement_threshold: 0.8,
    },
  });

  const options = useWatch({ control: form.control, name: "options" }) ?? [];
  const first = Number(options[0]?.seed_count) || 0;
  const second = Number(options[1]?.seed_count) || 0;
  const yesPct = impliedYesPercent(first, second);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: CreateMarketItemInput) => {
      const result = await marketItemsApi.create(payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      form.reset();
      onClose();
      toast.success("Market item created");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const onSubmit = (data: CreateMarketItemInput) => {
    mutate({
      ...data,
      title_my: data.title_my || undefined,
      resolution_criteria_en: data.resolution_criteria_en || undefined,
      resolution_criteria_my: data.resolution_criteria_my || undefined,
      slug: data.slug?.trim() || undefined,
      options: data.options.map((o: any) => ({
        title_en: o.title_en,
        title_my: o.title_my || undefined,
        seed_count: o.seed_count,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-4/5 overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Create Market Item</DialogTitle>
          <DialogDescription>
            Saving will create new market item for {initial.title_en}
          </DialogDescription>
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
                <FieldLabel>Slug (optional)</FieldLabel>
                <Input {...field} placeholder="Auto-generated from title if empty" />
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
          <Controller
            control={form.control}
            name="one_share_price"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>One Share Price (vKs)</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="platform_fee_percentage"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Platform fee %</FieldLabel>
                <Input {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <MarketItemOptionsEditor control={form.control} name="options" />
          <Controller
            control={form.control}
            name="seed_retirement_threshold"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Seed retirement threshold (0–1)</FieldLabel>
                <Input type="number" min={0} max={1} step={0.01} {...field} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          {options.length >= 2 && (
            <p className="text-sm text-muted-foreground">
              Initial odds (first two answers):{" "}
              <span className="font-semibold text-foreground">{yesPct}%</span> /{" "}
              <span className="font-semibold text-foreground">{100 - yesPct}%</span>
            </p>
          )}

          <DialogFooter>
            <Button variant={"secondary"} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
