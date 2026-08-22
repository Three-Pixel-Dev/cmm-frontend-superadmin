import { z } from "zod";
import { isValid, isAfter } from "date-fns";

export const marketItemOptionSchema = z.object({
  title_en: z
    .string()
    .min(1, "Answer title is required")
    .max(255, "Answer title must be 255 characters or less"),
  title_my: z
    .string()
    .max(255, { message: "Myanmar title must be 255 characters or less" })
    .optional()
    .or(z.literal("")),
  seed_count: z.coerce.number().int().min(0),
});

export const marketItemFieldsSchema = z.object({
  title_en: z
    .string()
    .min(1, "English title is required")
    .max(255, "English title must be 255 characters or less"),
  title_my: z
    .string()
    .max(255, { message: "Myanmar title must be 255 characters or less" })
    .optional()
    .or(z.literal("")),
  resolution_criteria_en: z
    .string()
    .max(5000, "English resolution criteria must be 5000 characters or less")
    .optional()
    .or(z.literal("")),
  resolution_criteria_my: z
    .string()
    .max(5000, { message: "Myanmar resolution criteria must be 5000 characters or less" })
    .optional()
    .or(z.literal("")),
  slug: z.string().max(255, "Max 255 characters").optional().or(z.literal("")),
  start_time: z.date().min(new Date()),
  close_time: z.date().min(new Date()),
  resolution_time: z.date().min(new Date()),
  one_share_price: z.coerce.number().gt(0),
  platform_fee_percentage: z.coerce.number().min(0).max(100),
  options: z.array(marketItemOptionSchema).min(2, "At least 2 answers are required"),
  seed_retirement_threshold: z.coerce.number().min(0).max(1),
});

export function withMarketItemTimeWindow<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine(
    (
      data: { start_time?: Date; close_time?: Date; resolution_time?: Date },
      ctx: z.RefinementCtx,
    ) => {
      const { start_time, close_time, resolution_time } = data;
      if (
        start_time &&
        close_time &&
        resolution_time &&
        isValid(start_time) &&
        isValid(close_time) &&
        isValid(resolution_time)
      ) {
        if (!isAfter(close_time, start_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Close time must be strictly after the start time",
            path: ["close_time"],
          });
        }
        if (!isAfter(resolution_time, close_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Resolution time must be strictly after the close time",
            path: ["resolution_time"],
          });
        }
      }
    },
  );
}

/** Nested in POST /markets when creating items alongside the market group. */
export const createMarketItemNestedSchema = withMarketItemTimeWindow(marketItemFieldsSchema);

export type CreateMarketItemNestedInput = z.infer<typeof createMarketItemNestedSchema>;

export const createMarketItemSchema = withMarketItemTimeWindow(
  marketItemFieldsSchema.extend({
    market_id: z.string().uuid("Market id is required"),
  }),
);

export type CreateMarketItemInput = z.infer<typeof createMarketItemSchema>;

export const marketOutcomeSchema = z.enum(["yes", "no", "void"]);

export const resolveMarketItemSchema = z
  .object({
    outcome: marketOutcomeSchema.optional(),
    winning_option_id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.outcome && !data.winning_option_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a winning answer or void",
        path: ["winning_option_id"],
      });
    }
    if (data.outcome === "void" && data.winning_option_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Void cannot be combined with a winning answer",
        path: ["outcome"],
      });
    }
  });

export type ResolveMarketItemInput = z.infer<typeof resolveMarketItemSchema>;

const marketStatusSchema = z.enum(["draft", "open", "closed", "settled", "cancelled", "voided"]);

export const updateMarketItemOptionSchema = z.object({
  id: z.string().uuid().optional(),
  title_en: z
    .string()
    .min(1, "Answer title is required")
    .max(255, "Answer title must be 255 characters or less"),
  title_my: z
    .string()
    .max(255, { message: "Myanmar title must be 255 characters or less" })
    .optional()
    .or(z.literal("")),
  seed_count: z.coerce.number().int().min(0),
});

export const updateMarketItemSchema = z
  .object({
    title_en: z
      .string()
      .max(255, { message: "English title must be 255 characters or less" })
      .optional()
      .or(z.literal("")),
    title_my: z
      .string()
      .max(255, { message: "Myanmar title must be 255 characters or less" })
      .optional()
      .or(z.literal("")),
    resolution_criteria_en: z
      .string()
      .max(5000, { message: "English resolution criteria must be 5000 characters or less" })
      .optional()
      .or(z.literal("")),
    resolution_criteria_my: z
      .string()
      .max(5000, { message: "Myanmar resolution criteria must be 5000 characters or less" })
      .optional()
      .or(z.literal("")),
    slug: z
      .string()
      .max(255, { message: "Slug must be 255 characters or less" })
      .optional()
      .or(z.literal("")),
    status: marketStatusSchema.optional(),
    start_time: z.date().optional(),
    close_time: z.date().min(new Date()).optional(),
    resolution_time: z.date().min(new Date()).optional(),
    is_enable: z.boolean().optional(),
    seed_yes_count: z.coerce.number().int().min(0).optional(),
    seed_no_count: z.coerce.number().int().min(0).optional(),
    seed_retirement_threshold: z.coerce.number().min(0).max(1).optional(),
    options: z.array(updateMarketItemOptionSchema).min(2).optional(),
  })
  .superRefine(({ start_time, close_time, resolution_time }, ctx) => {
    if (start_time && close_time && resolution_time) {
      if (isValid(start_time) && isValid(close_time) && isValid(resolution_time)) {
        if (!isAfter(close_time, start_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Close time must be strictly after the start time",
            path: ["close_time"],
          });
        }
        if (!isAfter(resolution_time, close_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Resolution time must be strictly after the close time",
            path: ["resolution_time"],
          });
        }
      }
    }
  });

export type UpdateMarketItemInput = z.infer<typeof updateMarketItemSchema>;
