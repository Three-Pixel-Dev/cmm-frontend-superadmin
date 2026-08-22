import { Market, MarketItem } from "@/types/market";
import {
  isMarketItemDraft,
  isMarketItemFinalized,
  isMarketItemResolvable,
} from "@/lib/market-item";

export function getDraftMarketItems(market: Market): MarketItem[] {
  return (market.market_items ?? []).filter(isMarketItemDraft);
}

export function marketHasDraftItems(market: Market): boolean {
  return getDraftMarketItems(market).length > 0;
}

export function getResolvableMarketItems(market: Market): MarketItem[] {
  return (market.market_items ?? []).filter(isMarketItemResolvable);
}

export function marketHasResolvableItems(market: Market): boolean {
  return getResolvableMarketItems(market).length > 0;
}

/** Non-finalized items (includes draft — e.g. for cancel). */
export function getActiveMarketItems(market: Market): MarketItem[] {
  return (market.market_items ?? []).filter((item) => !isMarketItemFinalized(item));
}

export function marketHasActiveItems(market: Market): boolean {
  return getActiveMarketItems(market).length > 0;
}

export type MarketAggregateStatus = "empty" | "draft" | "active" | "resolved";

export function getMarketAggregateStatus(market: Market): MarketAggregateStatus {
  const items = market.market_items ?? [];
  if (items.length === 0) return "empty";
  if (items.every(isMarketItemFinalized)) return "resolved";
  if (items.every(isMarketItemDraft)) return "draft";
  if (items.some(isMarketItemDraft)) return "draft";
  return "active";
}
