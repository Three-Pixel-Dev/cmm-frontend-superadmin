import { MarketItem, MarketStatus } from "@/types/market";

const FINAL_STATUSES: MarketStatus[] = ["settled", "cancelled", "voided"];

export function isMarketItemFinalized(item: MarketItem): boolean {
  return FINAL_STATUSES.includes(item.status);
}

export function isMarketItemDraft(item: MarketItem): boolean {
  return item.status === "draft";
}

/** Items that can be resolved or cancelled (published, not terminal). */
export function isMarketItemResolvable(item: MarketItem): boolean {
  return !isMarketItemFinalized(item) && !isMarketItemDraft(item);
}
