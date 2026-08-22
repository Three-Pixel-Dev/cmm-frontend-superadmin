import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Control, Controller, FieldPath, useFieldArray } from "react-hook-form";

export type MarketItemOptionFormValue = {
  id?: string;
  title_en: string;
  title_my?: string;
  seed_count: number;
};

export function defaultMarketItemOptions(): MarketItemOptionFormValue[] {
  return [
    { title_en: "Yes", title_my: "ဟုတ်ကဲ့", seed_count: 50 },
    { title_en: "No", title_my: "မဟုတ်ပါ", seed_count: 50 },
  ];
}

type Props<T extends Record<string, unknown>> = {
  control: Control<T>;
  name: FieldPath<T>;
};

export function MarketItemOptionsEditor<T extends Record<string, unknown>>({
  control,
  name,
}: Props<T>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-3 sm:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Answer options</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ title_en: "", title_my: "", seed_count: 0 } as never)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add answer
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add at least two named answers (e.g. USA, Australia, Draw).
      </p>
      {fields.map((field, optionIndex) => (
        <div
          key={field.id}
          className="grid gap-3 rounded-md border border-border/60 p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
        >
          <Controller
            control={control}
            name={`${name}.${optionIndex}.title_en` as FieldPath<T>}
            render={({ field: f, fieldState }) => (
              <Field>
                <FieldLabel>Title (EN)</FieldLabel>
                <Input {...f} value={f.value === undefined ? "" : String(f.value)} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={control}
            name={`${name}.${optionIndex}.title_my` as FieldPath<T>}
            render={({ field: f, fieldState }) => (
              <Field>
                <FieldLabel>Title (MY)</FieldLabel>
                <Input {...f} value={f.value === undefined ? "" : String(f.value)} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={control}
            name={`${name}.${optionIndex}.seed_count` as FieldPath<T>}
            render={({ field: f, fieldState }) => (
              <Field>
                <FieldLabel>Seed shares</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  {...f}
                  value={f.value === undefined ? "" : String(f.value)}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <div className="flex items-end pb-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={fields.length <= 2}
              onClick={() => remove(optionIndex)}
              aria-label="Remove answer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
