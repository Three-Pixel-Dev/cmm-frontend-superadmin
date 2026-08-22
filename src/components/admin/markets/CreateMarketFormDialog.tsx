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
  emptyMarketItem,
  MarketItemFieldsBlock,
} from "@/components/admin/markets/MarketItemFieldsBlock";
import { MarketPictureField } from "@/components/admin/MarketPictureField";
import { marketCategoriesApi, marketsApi } from "@/lib/admin/api";
import { CreateMarketInput, createMarketSchema } from "@/schemas/market.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toApiPayload(data: CreateMarketInput) {
  const { market_items, ...market } = data;
  return {
    ...market,
    file_id: market.file_id || undefined,
    title_my: market.title_my || undefined,
    description_my: market.description_my || undefined,
    market_items: market_items?.length
      ? market_items.map((item) => ({
          ...item,
          title_my: item.title_my || undefined,
          resolution_criteria_en: item.resolution_criteria_en || undefined,
          resolution_criteria_my: item.resolution_criteria_my || undefined,
          slug: item.slug?.trim() || undefined,
          start_time: item.start_time.toISOString(),
          close_time: item.close_time.toISOString(),
          resolution_time: item.resolution_time.toISOString(),
          options: item.options.map((o) => ({
            title_en: o.title_en,
            title_my: o.title_my || undefined,
            seed_count: o.seed_count,
          })),
        }))
      : undefined,
  };
}

export const CreateMarketFormDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const form = useForm({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      category_id: "",
      title_en: "",
      title_my: "",
      description_en: "",
      description_my: "",
      affiliate_rate_percent: 0,
      is_banner: false,
      file_id: "",
      market_items: [emptyMarketItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "market_items",
  });

  const queryClient = useQueryClient();

  const categoriesQ = useQuery({
    queryKey: ["admin", "market-categories"],
    queryFn: () => marketCategoriesApi.list({ include_disabled: false }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const general = categoriesQ.data?.find((c) => c.slug === "general");
    if (general && !form.getValues("category_id")) {
      form.setValue("category_id", general.id);
    }
  }, [open, categoriesQ.data, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: CreateMarketInput) => {
      return marketsApi.create(toApiPayload(payload) as CreateMarketInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      form.reset({
        category_id: categoriesQ.data?.find((c) => c.slug === "general")?.id ?? "",
        title_en: "",
        title_my: "",
        description_en: "",
        description_my: "",
        affiliate_rate_percent: 0,
        file_id: "",
        market_items: [emptyMarketItem()],
      });
      setPreviewUrl(null);
      onClose();
      toast.success("Market created");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  const onSubmit = (data: CreateMarketInput) => {
    mutate(data);
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[min(90rem,calc(100vw-2rem))] max-h-[92vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>Create market</DialogTitle>
          <DialogDescription>
            Add the market group and one or more tradeable items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <section className="space-y-4">
            <p className="text-sm font-medium text-foreground">Market group</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="category_id"
                render={({ field, fieldState }) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel>Category</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesQ.data?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
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
                name="description_en"
                render={({ field, fieldState }) => (
                  <Field className="sm:col-span-1">
                    <FieldLabel>Description (EN)</FieldLabel>
                    <Input {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="description_my"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Description (MY)</FieldLabel>
                    <Input {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="affiliate_rate_percent"
                render={({ field, fieldState }) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel>Affiliate rate (%)</FieldLabel>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Percent paid to users who refer bettors to this market.
                    </p>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="is_banner"
                render={({ field }) => (
                  <Field className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <span className="text-sm font-medium">Add to banner</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Feature this market in the customer homepage banner carousel.
                    </p>
                  </Field>
                )}
              />
              <div className="sm:col-span-2">
                <Field>
                  <FieldLabel>Market picture (optional)</FieldLabel>
                  <MarketPictureField
                    previewUrl={previewUrl}
                    onChange={({ fileId, previewUrl: url }) => {
                      form.setValue("file_id", fileId);
                      setPreviewUrl(url);
                    }}
                  />
                </Field>
              </div>
            </div>
          </section>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Market items</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyMarketItem())}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add item
              </Button>
            </div>
            <MarketItemFieldsBlock form={form} fields={fields} onRemove={remove} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
