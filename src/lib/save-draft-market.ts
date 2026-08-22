import { marketItemsApi, marketsApi } from "@/lib/admin/api";
import { buildMarketItemSeedUpdatePayload, marketItemSeedEditable } from "@/lib/market-pool";
import type { EditDraftMarketInput } from "@/schemas/market.schema";
import type { MarketItem } from "@/types/market";

export async function saveDraftMarketEdit(
  marketId: string,
  data: EditDraftMarketInput,
  existingItems: MarketItem[],
) {
  await marketsApi.update(marketId, {
    category_id: data.category_id,
    title_en: data.title_en,
    title_my: data.title_my || undefined,
    description_en: data.description_en,
    description_my: data.description_my || undefined,
    affiliate_rate_percent: data.affiliate_rate_percent,
    is_banner: data.is_banner,
    ...(data.file_id ? { file_id: data.file_id } : {}),
  });

  const existingById = new Map(existingItems.map((item) => [item.id, item]));

  for (const item of data.market_items) {
    const payload = {
      title_en: item.title_en,
      title_my: item.title_my || undefined,
      resolution_criteria_en: item.resolution_criteria_en || undefined,
      resolution_criteria_my: item.resolution_criteria_my || undefined,
      slug: item.slug?.trim() || undefined,
      start_time: item.start_time.toISOString(),
      close_time: item.close_time.toISOString(),
      resolution_time: item.resolution_time.toISOString(),
      one_share_price: item.one_share_price,
      platform_fee_percentage: item.platform_fee_percentage,
    };

    if (item.id) {
      const existing = existingById.get(item.id);
      const seedEditable = existing ? marketItemSeedEditable(existing) : false;
      await marketItemsApi.update(item.id, {
        ...payload,
        ...(seedEditable
          ? buildMarketItemSeedUpdatePayload(
              item.options,
              item.seed_retirement_threshold,
            )
          : {}),
      });
      continue;
    }

    await marketItemsApi.create({
      market_id: marketId,
      ...payload,
      options: item.options.map((o) => ({
        title_en: o.title_en,
        title_my: o.title_my || undefined,
        seed_count: o.seed_count,
      })),
      seed_retirement_threshold: item.seed_retirement_threshold,
    });
  }
}
