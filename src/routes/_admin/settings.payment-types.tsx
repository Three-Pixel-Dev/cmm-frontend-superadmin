import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/settings/payment-types")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/security" });
  },
  component: () => null,
});
