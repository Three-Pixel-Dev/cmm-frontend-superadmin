import { createFileRoute } from "@tanstack/react-router";
import { MarketsHistorySection } from "@/components/admin/MarketsHistorySection";

export const Route = createFileRoute("/_admin/market-history")({
  head: () => ({ meta: [{ title: "Market History — SuperCash Admin" }] }),
  component: MarketHistoryPage,
});

function MarketHistoryPage() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Market history</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Resolved and deleted markets. Resolved markets remain visible on the customer site until
          deleted.
        </p>
      </div>
      <MarketsHistorySection />
    </section>
  );
}
