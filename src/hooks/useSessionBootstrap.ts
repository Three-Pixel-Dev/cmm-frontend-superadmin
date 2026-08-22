import { useEffect } from "react";
import { authApi } from "@/lib/admin/api";
import { currentSessionBootstrapGeneration } from "@/lib/admin/sessionBootstrap";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuth } from "@/store/useAuth";

/** Restore session from HttpOnly cookies on client mount. */
export function useSessionBootstrap() {
  const hydrated = useHydrated();
  const setUser = useAuth((s) => s.setUser);
  const clearSession = useAuth((s) => s.clearSession);

  useEffect(() => {
    if (!hydrated) return;

    const generation = currentSessionBootstrapGeneration();

    authApi
      .me()
      .then((user) => {
        if (generation !== currentSessionBootstrapGeneration()) return;
        setUser(user);
      })
      .catch(() => {
        if (generation !== currentSessionBootstrapGeneration()) return;
        clearSession();
      });
  }, [hydrated, setUser, clearSession]);
}
