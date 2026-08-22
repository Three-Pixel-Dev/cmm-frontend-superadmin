import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsTab } from "@/components/admin/SettingsScreen";

export const Route = createFileRoute("/_admin/settings/security")({
  head: () => ({ meta: [{ title: "Security — Settings — SuperCash Admin" }] }),
  component: SecuritySettingsTab,
});
