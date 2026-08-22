import brokenImage from "@/assets/broken-image.jpg";
import { SettlementStatusBadge } from "@/components/admin/market-items/SettlementStatusBadge";
import { CancelMarketItemDialog } from "@/components/admin/market-items/CancelMarketItemDialog";
import { CreateMarketItemFormDialog } from "@/components/admin/market-items/CreateMarketItemFormDialog";
import { DeleteMarketItemDialog } from "@/components/admin/market-items/DeleteMarketItemDialog";
import { ResolveMarketItemDialog } from "@/components/admin/market-items/ResolveMarketItemDialog";
import { UpdateMarketItemFormDialog } from "@/components/admin/market-items/UpdateMarketItemFormDialog";
import { CancelMarketDialog } from "@/components/admin/markets/CancelMarketDialog";
import { CreateMarketFormDialog } from "@/components/admin/markets/CreateMarketFormDialog";
import { DeleteMarketDialog } from "@/components/admin/markets/DeleteMarketDialog";
import { PublishMarketDialog } from "@/components/admin/markets/PublishMarketDialog";
import { ResolveMarketDialog } from "@/components/admin/markets/ResolveMarketDialog";
import { UpdateMarketFormDialog } from "@/components/admin/markets/UpdateMarketFormDialog";
import { MarketAffiliatePanel } from "@/components/admin/markets/MarketAffiliatePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dashboardApi, marketsApi } from "@/lib/admin/api";
import { marketGroupVolume, topMarketsByVolume } from "@/lib/dashboard-analytics";
import { fmtKyatCompact, fmtVks } from "@/lib/format";
import {
  getMarketAggregateStatus,
  marketHasDraftItems,
  marketHasResolvableItems,
} from "@/lib/market";
import { isMarketItemFinalized, isMarketItemResolvable } from "@/lib/market-item";
import { realPoolTotalAmount } from "@/lib/market-pool";
import { cn } from "@/lib/utils";
import { Market, MarketItem } from "@/types/market";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  EllipsisVertical,
  History,
  ImageIcon,
  Link2,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BettingHistoriesDialog } from "./market-items/BettingHistoriesDialog";
import { MarketItemTransactionsDialog } from "./market-items/MarketItemTransactionsDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    resolved: "bg-blue-500/15 text-blue-400",
    cancelled: "bg-red-500/15 text-red-400",
    frozen: "bg-cyan-500/15 text-cyan-400",
    pending: "bg-amber-500/15 text-amber-400",
    draft: "bg-amber-500/15 text-amber-400",
    open: "bg-emerald-500/15 text-emerald-400",
    approved: "bg-emerald-500/15 text-emerald-400",
    rejected: "bg-red-500/15 text-red-400",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        cls[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function BannerToggle({ market }: { market: Market }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (next: boolean) => marketsApi.update(market.id, { is_banner: next }),
    onSuccess: (_data, next) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      toast.success(next ? "Added to banner" : "Removed from banner");
    },
    onError: () => toast.error("Could not update banner"),
  });

  return (
    <label
      className="flex items-center justify-center cursor-pointer"
      onClick={(e) => e.stopPropagation()}
      title="Show in customer homepage banner"
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-input accent-primary disabled:opacity-50"
        checked={market.is_banner ?? false}
        disabled={isPending}
        onChange={(e) => mutate(e.target.checked)}
      />
    </label>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 flex gap-4 items-start">
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Markets ───────────────────────────────────────────────────────────────────

const MARKETS_TABLE_HEADERS = [
  "",
  "",
  "Title (EN)",
  "Title (MY)",
  "Category (EN)",
  "Description (EN)",
  "Description (MY)",
  "Items",
  "Banner",
  "Status",
  "Actions",
];
const MARKET_ITEMS_TABLE_HEADERS = [
  "Title (EN)",
  "Title (MY)",
  "Slug",
  "Start Time",
  "Close Time",
  "Resolution Time",
  "Status",
  "Real Yes Count",
  "Real No Count",
  "Seed Yes Count",
  "Seed No Count",
  "Real Pool Total",
  "One Share Price",
  "Platform Fee %",
  "Applied Fee %",
  "Actions",
];

export function MarketsSection() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null);
  const [showHistoryMarketItemId, setShowHistoryMarketItemId] = useState<string | null>(null);
  const [showTransactionsMarketItemId, setShowTransactionsMarketItemId] = useState<string | null>(
    null,
  );

  const [createMarketOpen, setCreateMarketOpen] = useState(false);
  const [updateMarketTarget, setUpdateMarketTarget] = useState<Market | null>(null);
  const [deleteMarketTarget, setDeleteMarketTarget] = useState<Market | null>(null);
  const [publishMarketTarget, setPublishMarketTarget] = useState<Market | null>(null);
  const [resolveMarketTarget, setResolveMarketTarget] = useState<Market | null>(null);
  const [cancelMarketTarget, setCancelMarketTarget] = useState<Market | null>(null);

  const [createMarketItemTarget, setCreateMarketItemTarget] = useState<Market | null>(null);
  const [updateMarketItemTarget, setUpdateMarketItemTarget] = useState<MarketItem | null>(null);
  const [deleteMarketItemTarget, setDeleteMarketItemTarget] = useState<MarketItem | null>(null);

  const [resolveMarketItemTarget, setResolveMarketItemTarget] = useState<MarketItem | null>(null);
  const [cancelMarketItemTarget, setCancelMarketItemTarget] = useState<MarketItem | null>(null);

  const { data: markets } = useQuery({
    queryKey: ["markets", "management", search],
    queryFn: async () => {
      const result = await marketsApi.list({
        view: "management",
        ...(search ? { search } : {}),
        limit: 200,
      });
      return result.items;
    },
  });

  const toggleExpand = (marketId: string) => {
    setExpandedMarketId((prev) => (prev === marketId ? null : marketId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateMarketOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Create Market
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {MARKETS_TABLE_HEADERS.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets && markets.length > 0 ? (
              <>
                {markets.map((market) => (
                  <Fragment key={market.id}>
                    {/* Parent Row */}
                    <TableRow className="cursor-pointer">
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {expandedMarketId === market.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 rounded overflow-hidden">
                          {market.picture_url ? (
                            <img
                              src={market.picture_url}
                              alt={market.title_en}
                              className="w-full h-full object-cover"
                              onError={({ currentTarget }) => {
                                currentTarget.onerror = null; // Prevents infinite loop if fallback fails
                                currentTarget.src = brokenImage;
                              }}
                            />
                          ) : (
                            <ImageIcon />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {market.title_en}
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {market.title_my || "-"}
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {market.category?.title_en ?? "—"}
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {market.description_en}
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {market.description_my || "-"}
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        {market.market_items?.length || 0}
                      </TableCell>
                      <TableCell className="cursor-default">
                        <BannerToggle market={market} />
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(market.id)}>
                        <Badge variant="secondary" className="capitalize">
                          {getMarketAggregateStatus(market)}
                        </Badge>
                      </TableCell>

                      <TableCell className="cursor-default shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${market.title_en}`}
                            >
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {marketHasDraftItems(market) && (
                              <DropdownMenuItem onClick={() => setPublishMarketTarget(market)}>
                                <DollarSign className="h-4 w-4" /> Publish
                              </DropdownMenuItem>
                            )}
                            {marketHasResolvableItems(market) && (
                              <>
                                <DropdownMenuItem onClick={() => setResolveMarketTarget(market)}>
                                  <CheckCircle className="h-4 w-4" /> Resolve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCancelMarketTarget(market)}>
                                  <XCircle className="h-4 w-4" /> Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                if (marketHasDraftItems(market)) {
                                  navigate({
                                    to: "/markets/$marketId/edit",
                                    params: { marketId: market.id },
                                  });
                                  return;
                                }
                                setUpdateMarketTarget(market);
                              }}
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCreateMarketItemTarget(market)}>
                              <Plus className="h-4 w-4" /> Add item
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="danger"
                              onClick={() => setDeleteMarketTarget(market)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {expandedMarketId === market.id && (
                      <TableRow className="bg-accent/30">
                        <TableCell colSpan={MARKETS_TABLE_HEADERS.length} className="p-4">
                          <MarketAffiliatePanel market={market} />
                          {/* Market items table */}
                          <div className="w-full max-w-0 min-w-full overflow-x-auto rounded-xl border border-border/60 shadow bg-background">
                            <Table className="w-full min-w-[800px]">
                              <TableHeader>
                                <TableRow>
                                  {MARKET_ITEMS_TABLE_HEADERS.map((h) => (
                                    <TableHead key={h}>{h}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {market.market_items?.length ? (
                                  <>
                                    {market.market_items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.title_en}</TableCell>
                                        <TableCell>{item.title_my || "-"}</TableCell>
                                        <TableCell>{item.slug}</TableCell>
                                        <TableCell>
                                          {new Date(item.start_time).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(item.close_time).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(item.resolution_time).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex flex-col gap-1">
                                            <Badge variant={"secondary"} className="capitalize w-fit">
                                              {item.status}
                                            </Badge>
                                            {isMarketItemFinalized(item) && (
                                              <SettlementStatusBadge marketItemId={item.id} />
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {item.real_pool?.real_yes_count || "0"}
                                        </TableCell>
                                        <TableCell>
                                          {item.real_pool?.real_no_count || "0"}
                                        </TableCell>
                                        <TableCell>
                                          {item.real_pool?.seed_yes_count || "0"}
                                        </TableCell>
                                        <TableCell>
                                          {item.real_pool?.seed_no_count || "0"}
                                        </TableCell>
                                        <TableCell>
                                          {realPoolTotalAmount(
                                            item.real_pool,
                                            item.one_share_price,
                                            item.options,
                                          )}
                                        </TableCell>
                                        <TableCell>{item.one_share_price} vKs</TableCell>
                                        <TableCell>{item.platform_fee_percentage} %</TableCell>
                                        <TableCell>
                                          {item.effective_platform_fee_percent != null
                                            ? `${item.effective_platform_fee_percent} %`
                                            : "—"}
                                        </TableCell>
                                        <TableCell>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Actions for ${item.title_en}`}
                                              >
                                                <EllipsisVertical className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                              {isMarketItemResolvable(item) && (
                                                <DropdownMenuItem
                                                  onClick={() => setResolveMarketItemTarget(item)}
                                                >
                                                  <CheckCircle className="h-4 w-4" /> Resolve
                                                </DropdownMenuItem>
                                              )}
                                              {!isMarketItemFinalized(item) && (
                                                <DropdownMenuItem
                                                  onClick={() => setCancelMarketItemTarget(item)}
                                                >
                                                  <XCircle className="h-4 w-4" /> Cancel
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuItem
                                                onClick={() => setUpdateMarketItemTarget(item)}
                                              >
                                                <Pencil className="h-4 w-4" /> Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => setShowHistoryMarketItemId(item.id)}
                                              >
                                                <History className="h-4 w-4" /> Betting Histories
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                disabled={!isMarketItemFinalized(item)}
                                                onClick={() =>
                                                  setShowTransactionsMarketItemId(item.id)
                                                }
                                              >
                                                <Receipt className="h-4 w-4" /> Transaction History
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                variant="danger"
                                                onClick={() => setDeleteMarketItemTarget(item)}
                                              >
                                                <Trash2 className="h-4 w-4" /> Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </>
                                ) : (
                                  <TableRow>
                                    <TableCell
                                      colSpan={MARKET_ITEMS_TABLE_HEADERS.length}
                                      className="py-8 text-center"
                                    >
                                      No market items in this market.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={MARKETS_TABLE_HEADERS.length} className="py-8 text-center">
                  No markets.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Market item history dialog */}
      {showHistoryMarketItemId && (
        <BettingHistoriesDialog
          marketItemId={showHistoryMarketItemId}
          open={!!showHistoryMarketItemId}
          onClose={() => setShowHistoryMarketItemId(null)}
        />
      )}

      {showTransactionsMarketItemId && (
        <MarketItemTransactionsDialog
          marketItemId={showTransactionsMarketItemId}
          open={!!showTransactionsMarketItemId}
          onClose={() => setShowTransactionsMarketItemId(null)}
        />
      )}

      {/* Create market dialog */}
      <CreateMarketFormDialog open={createMarketOpen} onClose={() => setCreateMarketOpen(false)} />

      {/* Update market dialog */}
      {updateMarketTarget && (
        <UpdateMarketFormDialog
          open={!!updateMarketTarget}
          onClose={() => setUpdateMarketTarget(null)}
          initial={updateMarketTarget}
        />
      )}

      {/* Delete market dialog */}
      {deleteMarketTarget && (
        <DeleteMarketDialog
          open={!!deleteMarketTarget}
          onClose={() => setDeleteMarketTarget(null)}
          initial={deleteMarketTarget}
        />
      )}

      {publishMarketTarget && (
        <PublishMarketDialog
          open={!!publishMarketTarget}
          onClose={() => setPublishMarketTarget(null)}
          initial={publishMarketTarget}
        />
      )}

      {resolveMarketTarget && (
        <ResolveMarketDialog
          open={!!resolveMarketTarget}
          onClose={() => setResolveMarketTarget(null)}
          initial={resolveMarketTarget}
        />
      )}

      {cancelMarketTarget && (
        <CancelMarketDialog
          open={!!cancelMarketTarget}
          onClose={() => setCancelMarketTarget(null)}
          initial={cancelMarketTarget}
        />
      )}

      {/* Create market item dialog */}
      {createMarketItemTarget && (
        <CreateMarketItemFormDialog
          open={!!createMarketItemTarget}
          onClose={() => setCreateMarketItemTarget(null)}
          initial={createMarketItemTarget}
        />
      )}

      {/* Update market item dialog */}
      {updateMarketItemTarget && (
        <UpdateMarketItemFormDialog
          open={!!updateMarketItemTarget}
          onClose={() => setUpdateMarketItemTarget(null)}
          initial={updateMarketItemTarget}
        />
      )}

      {/* Delete market item dialog */}
      {deleteMarketItemTarget && (
        <DeleteMarketItemDialog
          open={!!deleteMarketItemTarget}
          onClose={() => setDeleteMarketItemTarget(null)}
          initial={deleteMarketItemTarget}
        />
      )}

      {resolveMarketItemTarget && (
        <ResolveMarketItemDialog
          open={!!resolveMarketItemTarget}
          onClose={() => setResolveMarketItemTarget(null)}
          initial={resolveMarketItemTarget}
        />
      )}

      {cancelMarketItemTarget && (
        <CancelMarketItemDialog
          open={!!cancelMarketItemTarget}
          onClose={() => setCancelMarketItemTarget(null)}
          initial={cancelMarketItemTarget}
        />
      )}
    </div>
  );
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function DashboardSection() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["dashboard", "platform-stats"],
    queryFn: () => dashboardApi.getPlatformStats(),
  });

  const { data: markets = [], isLoading: marketsLoading } = useQuery({
    queryKey: ["dashboard", "markets"],
    queryFn: async () => {
      const result = await marketsApi.list({ page: 1, limit: 200 });
      return result.items;
    },
  });

  const topMarkets = topMarketsByVolume(markets);
  const chartVolume = markets.reduce((sum, m) => sum + marketGroupVolume(m), 0);
  const loading = statsLoading || marketsLoading;

  return (
    <div className="space-y-8">
      {statsError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load platform stats. Redeploy market-service and ensure you have dashboard
          access.
        </p>
      )}

      <StatSection title="Platform revenue">
        <StatCard
          icon={<PiggyBank className="h-5 w-5" />}
          label="Net platform profit"
          value={loading ? "…" : fmtKyatCompact(stats?.platform_net_revenue ?? 0)}
          sub="After affiliate payouts"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Gross platform fees"
          value={loading ? "…" : fmtKyatCompact(stats?.platform_gross_revenue ?? 0)}
          sub="From settled markets"
        />
        <StatCard
          icon={<Link2 className="h-5 w-5" />}
          label="Affiliate paid out"
          value={loading ? "…" : fmtKyatCompact(stats?.total_affiliate_paid ?? 0)}
          sub="Total referral commissions"
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Net user funding"
          value={loading ? "…" : fmtKyatCompact(stats?.net_deposits ?? 0)}
          sub={`${loading ? "…" : fmtKyatCompact(stats?.total_deposits ?? 0)} deposited · ${loading ? "…" : fmtKyatCompact(stats?.total_withdrawals ?? 0)} withdrawn`}
        />
      </StatSection>

      <StatSection title="Volume & activity">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Real bet volume"
          value={loading ? "…" : fmtKyatCompact(stats?.total_real_volume ?? 0)}
          sub={`${loading ? "…" : (stats?.total_real_bets ?? 0).toLocaleString()} bets`}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Virtual bet volume"
          value={loading ? "…" : fmtVks(stats?.total_virtual_volume ?? 0)}
          sub={`${loading ? "…" : (stats?.total_virtual_bets ?? 0).toLocaleString()} bets`}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Active users"
          value={loading ? "…" : String(stats?.active_users ?? 0)}
          sub={`${loading ? "…" : (stats?.total_users ?? 0).toLocaleString()} total accounts`}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Open market items"
          value={loading ? "…" : String(stats?.open_market_items ?? 0)}
          sub={`${loading ? "…" : (stats?.settled_market_items ?? 0).toLocaleString()} settled · ${loading ? "…" : (stats?.total_markets ?? 0).toLocaleString()} groups`}
        />
      </StatSection>

      <StatSection title="Affiliate program">
        <StatCard
          icon={<Link2 className="h-5 w-5" />}
          label="Referral clicks"
          value={loading ? "…" : (stats?.referral_clicks ?? 0).toLocaleString()}
          sub="Across all market links"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Conversions"
          value={loading ? "…" : (stats?.affiliate_conversions ?? 0).toLocaleString()}
          sub="Bets via referral links"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Affiliate liability"
          value={loading ? "…" : fmtKyatCompact(stats?.total_affiliate_paid ?? 0)}
          sub="Paid to referrers to date"
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Fee retention"
          value={
            loading || !stats?.platform_gross_revenue
              ? "…"
              : `${Math.round((stats.platform_net_revenue / stats.platform_gross_revenue) * 100)}%`
          }
          sub="Net profit vs gross fees"
        />
      </StatSection>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Top Markets by Volume
        </h3>
        {marketsLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : topMarkets.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
            No market volume yet. Create and publish markets to see stats here.
          </p>
        ) : (
          <div className="space-y-2">
            {topMarkets.map(({ market: m, volume }, i) => {
              const pct = chartVolume > 0 ? (volume / chartVolume) * 100 : 0;
              return (
                <div key={m.id} className="rounded-lg border border-border/40 bg-card px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium truncate">
                      <span className="text-muted-foreground tabular-nums w-5 text-xs">
                        #{i + 1}
                      </span>
                      {m.title_en}
                    </span>
                    <span className="tabular-nums text-sm font-semibold shrink-0 ml-4">
                      {fmtKyatCompact(volume)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
