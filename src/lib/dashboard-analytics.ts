import type { Market } from "@/types/market";
import { realPoolTotalAmount } from "@/lib/market-pool";

export function marketGroupVolume(market: Market): number {
  return (market.market_items ?? []).reduce(
    (sum, item) =>
      sum +
      realPoolTotalAmount(item.real_pool, item.one_share_price, item.options) +
      realPoolTotalAmount(item.virtual_pool, item.one_share_price, item.options),
    0,
  );
}

export function topMarketsByVolume(markets: Market[], limit = 5) {
  return [...markets]
    .map((m) => ({ market: m, volume: marketGroupVolume(m) }))
    .filter((row) => row.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}
