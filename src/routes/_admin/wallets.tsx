import { createFileRoute } from "@tanstack/react-router";
import { WalletsScreen } from "@/components/admin/WalletsScreen";

export const Route = createFileRoute("/_admin/wallets")({
  head: () => ({ meta: [{ title: "Wallets — SuperCash Admin" }] }),
  component: WalletsScreen,
});
