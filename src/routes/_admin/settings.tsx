import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/settings")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/settings" || location.pathname === "/settings/") {
      throw redirect({ to: "/settings/profile" });
    }
  },
  component: SettingsLayoutRoute,
});

function SettingsLayoutRoute() {
  return (
    <div className="max-w-5xl">
      <Outlet />
    </div>
  );
}
