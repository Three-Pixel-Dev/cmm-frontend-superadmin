export type MarketStatus = "draft" | "open" | "closed" | "settled" | "cancelled" | "voided";

export type MarketOutcome = "yes" | "no" | "void";

export type ApiMarketCategoryBrief = {
  id: string;
  slug: string;
  title_en: string;
  title_my: string;
};

export type ApiMarketCategory = ApiMarketCategoryBrief & {
  sort_order: number;
  is_enable: boolean;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
  deleted_by?: string | null;
};

export type CreateMarketCategoryPayload = {
  slug: string;
  title_en: string;
  title_my?: string;
  sort_order?: number;
  is_enable?: boolean;
};

export type UpdateMarketCategoryPayload = {
  slug?: string;
  title_en?: string;
  title_my?: string;
  sort_order?: number;
  is_enable?: boolean;
};

export type MarketPool = {
  seed_retirement_threshold: number;
  seed_yes_count: number;
  seed_no_count: number;
  real_yes_count: number;
  real_no_count: number;
  total_pool: number;
};

export type MarketItemOptionPool = {
  seed_count: number;
  real_count: number;
};

export type MarketItemOption = {
  id: string;
  title_en: string;
  title_my: string;
  sort_order: number;
  real_pool?: MarketItemOptionPool;
  virtual_pool?: MarketItemOptionPool;
};

export type Market = {
  id: string;
  category_id: string;
  category?: ApiMarketCategoryBrief;
  title_en: string;
  title_my: string;
  description_en: string;
  description_my: string;
  picture_url: string;
  affiliate_rate_percent?: number;
  is_banner?: boolean;
  market_items?: MarketItem[];
  deleted_at?: string | null;
};

export type MarketItem = {
  id: string;
  slug: string;
  title_en: string;
  title_my: string;
  resolution_criteria_en: string;
  resolution_criteria_my: string;
  start_time: string;
  close_time: string;
  resolution_time: string;
  resolved_time: string | null;
  status: MarketStatus;
  outcome: MarketOutcome | null;
  winning_option_id?: string | null;
  one_share_price: number;
  platform_fee_percentage: number;
  effective_platform_fee_percent?: number | null;
  real_pool?: MarketPool;
  virtual_pool?: MarketPool;
  options?: MarketItemOption[];
};

export type TopReferrerEntry = {
  code: string;
  user_id: string;
  click_count: number;
  conversion_count: number;
  paid_amount: number;
  attributed_volume: number;
};

export type AffiliateRateHistoryEntry = {
  id: string;
  old_rate: number;
  new_rate: number;
  changed_by?: string | null;
  reason?: string | null;
  created_at: string;
};

export type MarketAffiliateStats = {
  market_id: string;
  affiliate_rate_percent: number;
  sharers: number;
  total_clicks: number;
  referred_bettors: number;
  attributed_volume: number;
  paid_affiliate: number;
  top_referrers: TopReferrerEntry[];
  rate_history: AffiliateRateHistoryEntry[];
};

export type PlatformStats = {
  total_real_volume: number;
  total_virtual_volume: number;
  platform_gross_revenue: number;
  total_affiliate_paid: number;
  platform_net_revenue: number;
  total_deposits: number;
  total_withdrawals: number;
  net_deposits: number;
  total_users: number;
  active_users: number;
  total_markets: number;
  open_market_items: number;
  settled_market_items: number;
  total_real_bets: number;
  total_virtual_bets: number;
  referral_clicks: number;
  affiliate_conversions: number;
};

export type BetHistory = {
  id: string;
  user: {
    id: string;
    fullname: string;
    email: string;
  };
  side: "yes" | "no";
  shares: number;
  amount: number;
  ledger: "real" | "virtual";
  created_at: string;
};
