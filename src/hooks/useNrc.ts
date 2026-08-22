import { useQuery } from "@tanstack/react-query";
import { nrcApi } from "@/lib/admin/api";

/** NRC reference data is static — fetch once and cache for the session. */
export function useNrcData() {
  return useQuery({
    queryKey: ["nrc", "data"],
    queryFn: () => nrcApi.getAll(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
