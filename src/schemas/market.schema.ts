import { z } from "zod";
import {
  createMarketItemNestedSchema,
  marketItemFieldsSchema,
  marketOutcomeSchema,
  withMarketItemTimeWindow,
} from "@/schemas/market-item.schema";

export const createMarketSchema = z.object({
  category_id: z.string().uuid("Category is required"),
  title_en: z
    .string()
    .min(1, "English title required")
    .max(255, { message: "English title must be 255 characters or less" }),
  title_my: z
    .string()
    .max(255, { message: "Myanmar title must be 255 characters or less" })
    .optional()
    .or(z.literal("")),
  description_en: z
    .string()
    .min(1, "English description required")
    .max(5000, { message: "English description must be 5000 characters or less" }),
  description_my: z
    .string()
    .max(5000, { message: "Myanmar description must be 5000 characters or less" })
    .optional()
    .or(z.literal("")),
  affiliate_rate_percent: z.coerce.number().min(0).max(100).default(0),
  is_banner: z.boolean().default(false),
  market_items: z.array(createMarketItemNestedSchema).optional(),
  file_id: z.string().uuid().optional().or(z.literal("")),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;

const editDraftMarketItemSchema = withMarketItemTimeWindow(
  marketItemFieldsSchema.extend({
    id: z.string().uuid().optional(),
    start_time: z.date(),
    close_time: z.date(),
    resolution_time: z.date(),
  }),
);

export const editDraftMarketSchema = createMarketSchema.extend({
  market_items: z.array(editDraftMarketItemSchema).min(1, "At least one market item is required"),
});

export type EditDraftMarketInput = z.infer<typeof editDraftMarketSchema>;

export const updateMarketSchema = z.object({
  category_id: z.string().uuid().optional().or(z.literal("")),
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
  description_en: z
    .string()
    .max(5000, { message: "English description must be 5000 characters or less" })
    .optional()
    .or(z.literal("")),
  description_my: z
    .string()
    .max(5000, { message: "Myanmar description must be 5000 characters or less" })
    .optional()
    .or(z.literal("")),
  affiliate_rate_percent: z.coerce.number().min(0).max(100).optional(),
  is_enable: z.boolean().optional(),
  is_banner: z.boolean().optional(),
  file_id: z.string().uuid().optional().or(z.literal("")),
});

export type UpdateMarketInput = z.infer<typeof updateMarketSchema>;

export const resolveMarketItemOutcomeSchema = z
  .object({
    market_item_id: z.string().uuid(),
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

export const resolveMarketSchema = z.object({
  items: z.array(resolveMarketItemOutcomeSchema).min(1, "Select at least one item"),
});

export type ResolveMarketInput = z.infer<typeof resolveMarketSchema>;
