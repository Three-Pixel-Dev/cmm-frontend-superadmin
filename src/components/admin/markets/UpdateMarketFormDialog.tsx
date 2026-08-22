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
import { marketCategoriesApi, marketsApi } from "@/lib/admin/api";
import { UpdateMarketInput, updateMarketSchema } from "@/schemas/market.schema";
import { Market } from "@/types/market";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UpdateMarketArgs {
  id: string;
  payload: UpdateMarketInput;
}

export const UpdateMarketFormDialog = ({
  initial,
  open,
  onClose,
}: {
  initial: Market;
  open: boolean;
  onClose: () => void;
}) => {
  const form = useForm({
    resolver: zodResolver(updateMarketSchema),
    defaultValues: {
      category_id: initial.category_id,
      title_en: initial.title_en,
      title_my: initial.title_my,
      description_en: initial.description_en,
      description_my: initial.description_my,
      affiliate_rate_percent: initial.affiliate_rate_percent ?? 0,
      is_banner: initial.is_banner ?? false,
    },
  });

  const queryClient = useQueryClient();

  const categoriesQ = useQuery({
    queryKey: ["admin", "market-categories"],
    queryFn: () => marketCategoriesApi.list({ include_disabled: true }),
    enabled: open,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ id, payload }: UpdateMarketArgs) => {
      const result = await marketsApi.update(id, payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      form.reset();
      onClose();
      toast.success("Market updated");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const onSubmit = (data: UpdateMarketInput) => {
    mutate({ id: initial.id, payload: data });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Market</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            control={form.control}
            name="category_id"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
              <Field>
                <FieldLabel>Affiliate rate (%)</FieldLabel>
                <Input
                  {...field}
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={field.value ?? 0}
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
              <Field>
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

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
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
