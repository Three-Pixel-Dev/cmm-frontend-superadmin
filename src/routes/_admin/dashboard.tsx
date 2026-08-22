import { createFileRoute } from "@tanstack/react-router";
import { DashboardSection } from "@/components/admin/DashboardMarketsSections";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SuperCash Admin" }] }),
  component: DashboardSection,
});
