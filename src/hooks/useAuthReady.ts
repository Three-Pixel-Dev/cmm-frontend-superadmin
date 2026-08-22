import { useEffect, useState } from "react";

import { useAuth } from "@/store/useAuth";

const HYDRATION_FALLBACK_MS = 3_000;

function readHydrated(): boolean {
  if (typeof window === "undefined") return false;
  return useAuth.persist?.hasHydrated() ?? false;
}

/** True once zustand persist has rehydrated auth state from storage (client only). */
export function useAuthReady() {
  const [ready, setReady] = useState(readHydrated);

  useEffect(() => {
    const persist = useAuth.persist;
    if (!persist) {
      setReady(true);
      return;
    }
    if (persist.hasHydrated()) {
      setReady(true);
      return;
    }

    const unsub = persist.onFinishHydration(() => setReady(true));
    const timer = window.setTimeout(() => setReady(true), HYDRATION_FALLBACK_MS);
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);

  return ready;
}
