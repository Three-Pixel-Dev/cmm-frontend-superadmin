import { createFileRoute } from "@tanstack/react-router";
import { RolesScreen } from "@/components/admin/RolesScreen";

export const Route = createFileRoute("/_admin/roles")({
  head: () => ({ meta: [{ title: "Roles — SuperCash Admin" }] }),
  component: RolesScreen,
});
