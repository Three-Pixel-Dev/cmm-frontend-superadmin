import { createFileRoute } from "@tanstack/react-router";
import { AccessCodesScreen } from "@/components/admin/AccessCodesScreen";

export const Route = createFileRoute("/_admin/access-codes")({
  head: () => ({ meta: [{ title: "Access codes — SuperCash Admin" }] }),
  component: AccessCodesScreen,
});
