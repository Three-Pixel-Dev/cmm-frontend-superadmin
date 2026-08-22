import { optionsFromMarketItem } from "@/lib/market-pool";
import type { EditDraftMarketInput } from "@/schemas/market.schema";
import type { Market, MarketItem } from "@/types/market";

export function marketToEditDraftForm(market: Market): EditDraftMarketInput {
  const items = (market.market_items ?? []).filter((item) => item.status === "draft");
  return {
    category_id: market.category_id,
    title_en: market.title_en,
    title_my: market.title_my ?? "",
    description_en: market.description_en,
    description_my: market.description_my ?? "",
    affiliate_rate_percent: market.affiliate_rate_percent ?? 0,
    is_banner: market.is_banner ?? false,
    file_id: "",
    market_items:
      items.length > 0
        ? items.map(marketItemToEditDraftForm)
        : [marketItemToEditDraftForm(emptyDraftItem())],
  };
}

function emptyDraftItem(): MarketItem {
  const now = Date.now();
  return {
    id: "",
    slug: "",
    title_en: "",
    title_my: "",
    resolution_criteria_en: "",
    resolution_criteria_my: "",
    start_time: new Date(now).toISOString(),
    close_time: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    resolution_time: new Date(now + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    resolved_time: null,
    status: "draft",
    outcome: null,
    one_share_price: 5000,
    platform_fee_percentage: 5,
    real_pool: {
      seed_retirement_threshold: 0.8,
      seed_yes_count: 0,
      seed_no_count: 0,
      real_yes_count: 0,
      real_no_count: 0,
      total_pool: 0,
    },
  };
}

function marketItemToEditDraftForm(item: MarketItem): EditDraftMarketInput["market_items"][number] {
  const pool = item.real_pool ?? item.virtual_pool;
  const options = optionsFromMarketItem(item);
  return {
    id: item.id,
    title_en: item.title_en,
    title_my: item.title_my ?? "",
    resolution_criteria_en: item.resolution_criteria_en ?? "",
    resolution_criteria_my: item.resolution_criteria_my ?? "",
    slug: item.slug ?? "",
    start_time: new Date(item.start_time),
    close_time: new Date(item.close_time),
    resolution_time: new Date(item.resolution_time),
    one_share_price: item.one_share_price,
    platform_fee_percentage: item.platform_fee_percentage,
    seed_retirement_threshold: pool?.seed_retirement_threshold ?? 0.8,
    options,
  };
}
