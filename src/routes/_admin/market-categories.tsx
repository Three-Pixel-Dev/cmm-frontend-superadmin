import { createFileRoute } from "@tanstack/react-router";
import { MarketCategoriesSection } from "@/components/admin/markets/MarketCategoriesSection";

export const Route = createFileRoute("/_admin/market-categories")({
  head: () => ({ meta: [{ title: "Market Categories — SuperCash Admin" }] }),
  component: MarketCategoriesPage,
});

function MarketCategoriesPage() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Market categories</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Categories appear as filter chips on the customer markets homepage.
        </p>
      </div>
      <MarketCategoriesSection />
    </section>
  );
}
