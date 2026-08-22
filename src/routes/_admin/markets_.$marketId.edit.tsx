import { createFileRoute } from "@tanstack/react-router";
import { EditDraftMarketPage } from "@/components/admin/markets/EditDraftMarketPage";

export const Route = createFileRoute("/_admin/markets_/$marketId/edit")({
  head: () => ({ meta: [{ title: "Edit draft market — SuperCash Admin" }] }),
  component: EditDraftMarketRoute,
});

function EditDraftMarketRoute() {
  const { marketId } = Route.useParams();
  return <EditDraftMarketPage marketId={marketId} />;
}
