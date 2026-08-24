import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/settings/payment")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/security" });
  },
  component: () => null,
});
