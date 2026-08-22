import { createFileRoute } from "@tanstack/react-router";
import { BannerManagementTab } from "@/components/admin/BannerManagementTab";

export const Route = createFileRoute("/_admin/banners")({
  head: () => ({ meta: [{ title: "Banners — SuperCash Admin" }] }),
  component: BannerManagementTab,
});
