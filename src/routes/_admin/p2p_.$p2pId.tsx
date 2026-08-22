import { createFileRoute } from "@tanstack/react-router";
import { P2PAgentDetail } from "@/components/admin/P2PAgentDetail";

export const Route = createFileRoute("/_admin/p2p_/$p2pId")({
  head: () => ({ meta: [{ title: "P2P Agent — SuperCash Admin" }] }),
  component: P2PAgentDetailRoute,
});

function P2PAgentDetailRoute() {
  const { p2pId } = Route.useParams();
  return <P2PAgentDetail p2pId={p2pId} />;
}
