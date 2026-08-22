import type { QueryClient } from "@tanstack/react-query";

import { useAuth } from "@/store/useAuth";

let queryClient: QueryClient | null = null;

export function registerAdminQueryClient(client: QueryClient) {
  queryClient = client;
}

export function clearAdminSession() {
  queryClient?.clear();
  useAuth.getState().logout();
}

export function invalidateMyPermissions(client: QueryClient) {
  client.invalidateQueries({ queryKey: ["admin", "me", "permissions"] });
}
