import { useEffect } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthBootScreen } from "@/components/AuthBootScreen";
import { WebsocketContextProvider } from "@/components/WebsocketProvider";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useHydrated } from "@/hooks/useHydrated";
import { authApi } from "@/lib/admin/api";
import { isSectionAllowed, pathToSection, SECTION_PATHS } from "@/lib/admin/nav";
import { clearAdminSession, registerAdminQueryClient } from "@/lib/admin/session";
import { useAuth } from "@/store/useAuth";

export function AdminLayout() {
  const hydrated = useHydrated();
  const authReady = useAuthReady();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    registerAdminQueryClient(queryClient);
  }, [queryClient]);

  const user = useAuth((s) => s.user);
  const isAdmin = useAuth((s) => s.isAdmin());
  const active = pathToSection(pathname);

  const permsQ = useQuery({
    queryKey: ["admin", "me", "permissions", user?.id],
    queryFn: () => authApi.myPermissions(),
    enabled: !!user?.id,
    staleTime: 0,
    retry: false,
  });
  const allowedCodes = permsQ.data?.codes;

  useEffect(() => {
    if (!user || !isAdmin) return;
    if (permsQ.isLoading || permsQ.isFetching) return;
    if (!isSectionAllowed(active, allowedCodes, user?.role_name)) {
      navigate({ to: SECTION_PATHS.home });
    }
  }, [active, allowedCodes, permsQ.isLoading, permsQ.isFetching, user, isAdmin, navigate]);

  const handleLogout = () => {
    clearAdminSession();
    toast.success("Signed out");
  };

  // SSR has no localStorage — render login immediately so the page is not a blank spinner
  // if Vite client JS is slow or fails to load.
  if (!hydrated) {
    return <AdminLogin />;
  }

  if (!authReady) {
    return <AuthBootScreen />;
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <WebsocketContextProvider>
      <AdminShell
        active={active}
        allowedCodes={allowedCodes}
        userEmail={user.email}
        onLogout={handleLogout}
      >
        <Outlet />
      </AdminShell>
    </WebsocketContextProvider>
  );
}
