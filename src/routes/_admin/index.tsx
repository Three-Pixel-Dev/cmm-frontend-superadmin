import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HomeSection } from "@/components/admin/HomeSection";
import { authApi } from "@/lib/admin/api";
import { useAuth } from "@/store/useAuth";

export const Route = createFileRoute("/_admin/")({
  head: () => ({ meta: [{ title: "Home — SuperCash Admin" }] }),
  component: AdminHomePage,
});

function AdminHomePage() {
  const user = useAuth((s) => s.user);
  const permsQ = useQuery({
    queryKey: ["admin", "me", "permissions", user?.id],
    queryFn: () => authApi.myPermissions(),
    enabled: !!user?.id,
  });

  return (
    <HomeSection
      name={user?.name}
      email={user?.email}
      roleName={user?.role_name}
      allowedCodes={permsQ.data?.codes}
    />
  );
}
