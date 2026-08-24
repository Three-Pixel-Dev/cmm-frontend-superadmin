import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/settings/crypto-wallet")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/security" });
  },
  component: () => null,
});
