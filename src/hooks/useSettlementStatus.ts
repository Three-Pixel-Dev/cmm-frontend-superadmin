import { settlementApi, type SettlementStatus } from "@/lib/admin/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function isSettlementNotFound(err: unknown): boolean {
  return err instanceof Error && /not found/i.test(err.message);
}

export function useSettlementStatus(marketItemId: string, enabled = true) {
  return useQuery({
    queryKey: ["settlement-status", marketItemId],
    enabled: enabled && Boolean(marketItemId),
    queryFn: async (): Promise<SettlementStatus | null> => {
      try {
        return await settlementApi.status(marketItemId);
      } catch (err) {
        if (isSettlementNotFound(err)) return null;
        throw err;
      }
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "running") return 2000;
      return false;
    },
  });
}

export function useSettlementRetry(marketItemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => settlementApi.retry(marketItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlement-status", marketItemId] });
      toast.success("Settlement retry queued");
    },
    onError: (err: Error) => toast.error(err.message || "Could not retry settlement"),
  });
}
