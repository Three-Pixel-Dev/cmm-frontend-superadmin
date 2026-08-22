import { createFileRoute } from "@tanstack/react-router";
import { P2PScreen } from "@/components/admin/P2PScreen";

type P2PSearch = {
  tab?: "agents" | "applications" | "crypto-deposits";
};

export const Route = createFileRoute("/_admin/p2p")({
  head: () => ({ meta: [{ title: "P2P Agents — SuperCash Admin" }] }),
  validateSearch: (search: Record<string, unknown>): P2PSearch => ({
    tab:
      search.tab === "agents" || search.tab === "applications" || search.tab === "crypto-deposits"
        ? search.tab
        : undefined,
  }),
  component: P2PScreen,
});
