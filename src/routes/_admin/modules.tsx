import { createFileRoute } from "@tanstack/react-router";
import { ModulesScreen } from "@/components/admin/ModulesScreen";

export const Route = createFileRoute("/_admin/modules")({
  head: () => ({ meta: [{ title: "Modules — SuperCash Admin" }] }),
  component: ModulesScreen,
});
