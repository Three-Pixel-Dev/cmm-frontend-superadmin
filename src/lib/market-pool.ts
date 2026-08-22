import type { MarketItemOptionFormValue } from "@/components/admin/markets/MarketItemOptionsEditor";
import type { UpdateMarketItemInput } from "@/schemas/market-item.schema";
import type { MarketPool } from "@/types/market";

/** Bettor stake only — excludes platform seed liquidity. */
export function realPoolTotalAmount(
  pool: Pick<MarketPool, "real_yes_count" | "real_no_count"> | null | undefined,
  oneSharePrice: number,
  options?: { real_pool?: { real_count: number } | null }[] | null,
): number {
  if (options && options.length > 0) {
    const realShares = options.reduce((sum, o) => sum + (o.real_pool?.real_count ?? 0), 0);
    return realShares * oneSharePrice;
  }
  if (!pool) return 0;
  return (pool.real_yes_count + pool.real_no_count) * oneSharePrice;
}

/** Implied Yes probability from seed share counts (matches user-app poolYesPrice when no real bets). */
export function impliedYesPercent(seedYes: number, seedNo: number): number {
  const total = seedYes + seedNo;
  if (total <= 0) return 50;
  const raw = (seedYes / total) * 100;
  return Math.round(Math.max(2, Math.min(98, raw)));
}

export function poolSeedEditable(
  status: string,
  realYes: number,
  realNo: number,
): boolean {
  return status === "draft" && realYes + realNo === 0;
}

/** PATCH payload for pool seed edits — uses legacy yes/no counts when option ids are absent. */
export function buildMarketItemSeedUpdatePayload(
  options: Pick<MarketItemOptionFormValue, "id" | "title_en" | "title_my" | "seed_count">[],
  seedRetirementThreshold: number,
): Pick<
  UpdateMarketItemInput,
  "options" | "seed_yes_count" | "seed_no_count" | "seed_retirement_threshold"
> {
  const threshold = seedRetirementThreshold;
  const hasIds = options.length >= 2 && options.every((o) => o.id);

  if (hasIds) {
    return {
      options: options.map((o) => ({
        id: o.id,
        title_en: o.title_en,
        title_my: o.title_my || undefined,
        seed_count: o.seed_count,
      })),
      seed_retirement_threshold: threshold,
    };
  }

  if (options.length === 2) {
    return {
      seed_yes_count: options[0].seed_count,
      seed_no_count: options[1].seed_count,
      seed_retirement_threshold: threshold,
    };
  }

  return {
    options: options.map((o) => ({
      ...(o.id ? { id: o.id } : {}),
      title_en: o.title_en,
      title_my: o.title_my || undefined,
      seed_count: o.seed_count,
    })),
    seed_retirement_threshold: threshold,
  };
}

export function marketItemSeedEditable(item: {
  status: string;
  real_pool?: { real_yes_count: number; real_no_count: number } | null;
  options?: { real_pool?: { real_count: number } | null }[];
}): boolean {
  if (item.status !== "draft" && item.status !== "open") return false;
  const pool = item.real_pool;
  if (pool && pool.real_yes_count + pool.real_no_count > 0) return false;
  if (item.options?.some((o) => (o.real_pool?.real_count ?? 0) > 0)) return false;
  return true;
}

export function optionsFromMarketItem(item: {
  options?: {
    id: string;
    title_en: string;
    title_my: string;
    sort_order: number;
    real_pool?: { seed_count: number };
  }[];
  real_pool?: { seed_yes_count: number; seed_no_count: number } | null;
}): MarketItemOptionFormValue[] {
  if (item.options && item.options.length >= 2) {
    return [...item.options]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({
        id: o.id,
        title_en: o.title_en,
        title_my: o.title_my,
        seed_count: o.real_pool?.seed_count ?? 0,
      }));
  }
  const pool = item.real_pool;
  return [
    { title_en: "Yes", title_my: "ဟုတ်ကဲ့", seed_count: pool?.seed_yes_count ?? 0 },
    { title_en: "No", title_my: "မဟုတ်ပါ", seed_count: pool?.seed_no_count ?? 0 },
  ];
}
