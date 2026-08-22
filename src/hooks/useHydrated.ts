import { useEffect, useState } from "react";

/** True after the first client render — avoids SSR/client mismatch for persisted state. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
