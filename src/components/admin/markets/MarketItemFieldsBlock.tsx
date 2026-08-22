import { DateTimePicker } from "@/components/DateTimePicker";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  defaultMarketItemOptions,
  MarketItemOptionsEditor,
} from "@/components/admin/markets/MarketItemOptionsEditor";
import { impliedYesPercent } from "@/lib/market-pool";
import { CreateMarketInput } from "@/schemas/market.schema";
import { Trash2 } from "lucide-react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldPath,
  UseFormReturn,
  useWatch,
} from "react-hook-form";

type MarketItemTextField =
  | "title_en"
  | "title_my"
  | "resolution_criteria_en"
  | "resolution_criteria_my"
  | "slug"
  | "one_share_price"
  | "platform_fee_percentage"
  | "seed_retirement_threshold";

const defaultItem = (): NonNullable<CreateMarketInput["market_items"]>[number] => ({
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
});

export function emptyMarketItem() {
  return defaultItem();
}

type Props = {
  form: UseFormReturn<CreateMarketInput>;
  fields: FieldArrayWithId<CreateMarketInput, "market_items", "id">[];
  onRemove: (index: number) => void;
};

export function MarketItemFieldsBlock({ form, fields, onRemove }: Props) {
  const { control } = form;

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-border/60 p-4 space-y-4 bg-muted/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Market item {index + 1}</p>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ItemField control={control} index={index} name="title_en" label="Title (EN)" />
            <ItemField control={control} index={index} name="title_my" label="Title (MY)" />
            <ItemField
              control={control}
              index={index}
              name="slug"
              label="Slug (optional)"
              placeholder="Auto-generated from title if empty"
            />
            <ItemField
              control={control}
              index={index}
              name="resolution_criteria_en"
              label="Resolution criteria (EN)"
              className="sm:col-span-2 lg:col-span-3"
            />
            <ItemField
              control={control}
              index={index}
              name="resolution_criteria_my"
              label="Resolution criteria (MY)"
              className="sm:col-span-2 lg:col-span-3"
            />
            <Controller
              control={control}
              name={`market_items.${index}.start_time`}
              render={({ field: f, fieldState }) => (
                <Field>
                  <FieldLabel>Start time</FieldLabel>
                  <DateTimePicker value={f.value} onChange={f.onChange} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              control={control}
              name={`market_items.${index}.close_time`}
              render={({ field: f, fieldState }) => (
                <Field>
                  <FieldLabel>Close time</FieldLabel>
                  <DateTimePicker value={f.value} onChange={f.onChange} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              control={control}
              name={`market_items.${index}.resolution_time`}
              render={({ field: f, fieldState }) => (
                <Field>
                  <FieldLabel>Resolution time</FieldLabel>
                  <DateTimePicker value={f.value} onChange={f.onChange} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <ItemField
              control={control}
              index={index}
              name="one_share_price"
              label="One share price (vKs)"
            />
            <ItemField
              control={control}
              index={index}
              name="platform_fee_percentage"
              label="Platform fee %"
            />
            <MarketItemOptionsEditor
              control={control}
              name={`market_items.${index}.options`}
            />
            <ItemField
              control={control}
              index={index}
              name="seed_retirement_threshold"
              label="Seed retirement threshold (0–1)"
            />
            <SeedOddsPreview control={control} index={index} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SeedOddsPreview({
  control,
  index,
}: {
  control: Control<CreateMarketInput>;
  index: number;
}) {
  const options = useWatch({ control, name: `market_items.${index}.options` }) ?? [];
  const first = Number(options[0]?.seed_count) || 0;
  const second = Number(options[1]?.seed_count) || 0;
  const pct = impliedYesPercent(first, second);

  return (
    <div className="sm:col-span-2 lg:col-span-3 rounded-md border border-dashed border-border/80 px-3 py-2 text-sm text-muted-foreground">
      {options.length >= 2 ? (
        <>
          Initial odds for first two answers:{" "}
          <span className="font-semibold text-foreground tabular-nums">{pct}%</span> /{" "}
          <span className="font-semibold text-foreground tabular-nums">{100 - pct}%</span>
          <span className="ml-2">
            ({first} / {second} seed shares)
          </span>
        </>
      ) : (
        "Add at least two answers to preview initial odds."
      )}
    </div>
  );
}

function ItemField({
  control,
  index,
  name,
  label,
  className,
  placeholder,
}: {
  control: Control<CreateMarketInput>;
  index: number;
  name: MarketItemTextField;
  label: string;
  className?: string;
  placeholder?: string;
}) {
  const fieldName = `market_items.${String(index)}.${name}` as FieldPath<CreateMarketInput>;
  return (
    <Controller
      control={control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <Input
            {...field}
            placeholder={placeholder}
            value={field.value === undefined || field.value === null ? "" : String(field.value)}
          />
          <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  );
}
