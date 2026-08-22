import { createFileRoute } from "@tanstack/react-router";
import { MarketsSection } from "@/components/admin/DashboardMarketsSections";

export const Route = createFileRoute("/_admin/markets")({
  head: () => ({ meta: [{ title: "Markets — SuperCash Admin" }] }),
  component: MarketsSection,
});
