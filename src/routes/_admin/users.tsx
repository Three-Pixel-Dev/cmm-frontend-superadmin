import { createFileRoute } from "@tanstack/react-router";
import { UsersScreen } from "@/components/admin/UsersScreen";

export const Route = createFileRoute("/_admin/users")({
  head: () => ({ meta: [{ title: "Users — SuperCash Admin" }] }),
  component: UsersScreen,
});
