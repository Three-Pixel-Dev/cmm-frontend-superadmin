import { Button } from "@/components/ui/button";
import { useSettlementRetry, useSettlementStatus } from "@/hooks/useSettlementStatus";
import { cn } from "@/lib/utils";
import { Loader2, RotateCcw } from "lucide-react";

export function SettlementStatusBadge({
  marketItemId,
  showWhenIdle = false,
}: {
  marketItemId: string;
  showWhenIdle?: boolean;
}) {
  const { data, isLoading } = useSettlementStatus(marketItemId);
  const { mutate: retry, isPending: retrying } = useSettlementRetry(marketItemId);

  if (isLoading || !data) {
    return showWhenIdle ? null : null;
  }

  if (data.status === "completed" && !showWhenIdle) {
    return null;
  }

  const pct =
    data.total_bets > 0 ? Math.min(100, Math.round((data.processed_bets / data.total_bets) * 100)) : 0;

  const cls: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    running: "bg-cyan-500/15 text-cyan-400",
    completed: "bg-emerald-500/15 text-emerald-400",
    failed: "bg-red-500/15 text-red-400",
  };

  const label =
    data.status === "running"
      ? `Settling ${pct}%`
      : data.status === "pending"
        ? "Settlement queued"
        : data.status === "failed"
          ? "Settlement failed"
          : "Settled";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
          cls[data.status] ?? "bg-muted text-muted-foreground",
        )}
      >
        {(data.status === "pending" || data.status === "running") && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {label}
        {data.total_bets > 0 && (data.status === "pending" || data.status === "running") && (
          <span className="tabular-nums opacity-80">
            ({data.processed_bets}/{data.total_bets})
          </span>
        )}
      </span>
      {data.status === "failed" && (
        <div className="flex flex-col gap-1">
          {data.last_error && (
            <p className="text-xs text-destructive max-w-[220px] truncate" title={data.last_error}>
              {data.last_error}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-fit text-xs"
            disabled={retrying}
            onClick={() => retry()}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry settlement
          </Button>
        </div>
      )}
    </div>
  );
}
