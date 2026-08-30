import { Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { MarketPictureField } from "@/components/admin/MarketPictureField";
import {
  emptyMarketItem,
  MarketItemFieldsBlock,
} from "@/components/admin/markets/MarketItemFieldsBlock";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marketCategoriesApi, marketsApi } from "@/lib/admin/api";
import { marketToEditDraftForm } from "@/lib/market-draft-form";
import { saveDraftMarketEdit } from "@/lib/save-draft-market";
import {
  editDraftMarketSchema,
  type CreateMarketInput,
  type EditDraftMarketInput,
} from "@/schemas/market.schema";

export function EditDraftMarketPage({ marketId }: { marketId: string }) {
  const qc = useQueryClient();
  const marketQ = useQuery({
    queryKey: ["markets", marketId],
    queryFn: () => marketsApi.get(marketId),
  });

  const categoriesQ = useQuery({
    queryKey: ["admin", "market-categories"],
    queryFn: () => marketCategoriesApi.list({ include_disabled: true }),
  });

  const form = useForm<EditDraftMarketInput>({
    resolver: zodResolver(editDraftMarketSchema) as any,
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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!marketQ.data || hydrated) return;
    form.reset(marketToEditDraftForm(marketQ.data));
    setPreviewUrl(marketQ.data.picture_url || null);
    setHydrated(true);
  }, [marketQ.data, hydrated, form]);

  const saveM = useMutation({
    mutationFn: (payload: EditDraftMarketInput) =>
      saveDraftMarketEdit(marketId, payload, marketQ.data?.market_items ?? []),
    onSuccess: () => {
      toast.success("Draft market saved");
      setHydrated(false);
      void qc.invalidateQueries({ queryKey: ["markets"] });
      void qc.invalidateQueries({ queryKey: ["markets", marketId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save draft market"),
  });

  if (marketQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading market…
      </div>
    );
  }

  if (marketQ.isError || !marketQ.data) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Could not load this market.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/markets">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to markets
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Review draft market</h1>
          <p className="text-sm text-muted-foreground">
            Verify resolutions, seeds, and timing before publishing.
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((data: any) => saveM.mutate(data))}
        className="space-y-8 rounded-xl border border-border/60 bg-card p-5 sm:p-8"
      >
        <section className="space-y-4">
          <p className="text-sm font-medium">Market group</p>
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
                <Field>
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
            <p className="text-sm font-medium">Market items (questions)</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyMarketItem())}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add item
            </Button>
          </div>
          <MarketItemFieldsBlock
            form={form as unknown as UseFormReturn<CreateMarketInput>}
            fields={fields}
            onRemove={remove}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/markets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save draft"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
