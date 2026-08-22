import { createFileRoute } from "@tanstack/react-router";
import { P2PApplicationDetail } from "@/components/admin/P2PApplicationDetail";

export const Route = createFileRoute("/_admin/p2p_/applications/$applicationId")({
  head: () => ({ meta: [{ title: "P2P Application — SuperCash Admin" }] }),
  component: P2PApplicationDetailRoute,
});

function P2PApplicationDetailRoute() {
  const { applicationId } = Route.useParams();
  return <P2PApplicationDetail applicationId={applicationId} />;
}
