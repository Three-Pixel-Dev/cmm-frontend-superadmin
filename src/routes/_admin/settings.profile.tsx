import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettingsTab } from "@/components/admin/SettingsScreen";

export const Route = createFileRoute("/_admin/settings/profile")({
  head: () => ({ meta: [{ title: "Profile — Settings — SuperCash Admin" }] }),
  component: ProfileSettingsTab,
});
