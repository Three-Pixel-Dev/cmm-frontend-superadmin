import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { marketsApi } from "@/lib/admin/api";
import { fmtKyatCompact } from "@/lib/format";
import type { Market } from "@/types/market";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function MarketAffiliatePanel({ market }: { market: Market }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [newRate, setNewRate] = useState(String(market.affiliate_rate_percent ?? 0));
  const [reason, setReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["market-affiliate-stats", market.id],
    queryFn: () => marketsApi.getAffiliateStats(market.id),
  });

  const { mutate: updateRate, isPending } = useMutation({
    mutationFn: () =>
      marketsApi.updateAffiliateRate(market.id, {
        affiliate_rate_percent: Number(newRate) || 0,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market-affiliate-stats", market.id] });
      qc.invalidateQueries({ queryKey: ["markets"] });
      setEditOpen(false);
      setReason("");
      toast.success("Affiliate rate updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update rate"),
  });

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading affiliate stats…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="mb-4 text-sm text-muted-foreground" role="alert">
        Unable to load affiliate stats.
      </p>
    );
  }

  return (
    <section
      className="mb-4 space-y-4 rounded-xl border border-border/60 bg-background p-4"
      aria-label="Market affiliate statistics"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Affiliate program</h4>
          <p className="text-xs text-muted-foreground">
            Current rate: {data.affiliate_rate_percent}%
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          Edit rate
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Sharers" value={data.sharers} />
        <StatCard label="Total clicks" value={data.total_clicks} />
        <StatCard label="Referred bettors" value={data.referred_bettors} />
        <StatCard label="Attributed volume" value={fmtKyatCompact(data.attributed_volume)} />
        <StatCard label="Paid affiliate" value={fmtKyatCompact(data.paid_affiliate)} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Code</TableHead>
              <TableHead scope="col">User</TableHead>
              <TableHead scope="col">Clicks</TableHead>
              <TableHead scope="col">Conversions</TableHead>
              <TableHead scope="col">Volume</TableHead>
              <TableHead scope="col">Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.top_referrers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No referrers yet.
                </TableCell>
              </TableRow>
            ) : (
              data.top_referrers.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell className="font-mono text-xs">{row.user_id.slice(0, 8)}…</TableCell>
                  <TableCell>{row.click_count}</TableCell>
                  <TableCell>{row.conversion_count}</TableCell>
                  <TableCell>{fmtKyatCompact(row.attributed_volume)}</TableCell>
                  <TableCell>{fmtKyatCompact(row.paid_amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.rate_history.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">When</TableHead>
                <TableHead scope="col">Old rate</TableHead>
                <TableHead scope="col">New rate</TableHead>
                <TableHead scope="col">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rate_history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                  <TableCell>{h.old_rate}%</TableCell>
                  <TableCell>{h.new_rate}%</TableCell>
                  <TableCell>{h.reason || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update affiliate rate</DialogTitle>
            <DialogDescription>
              Changes apply to new bets only. Existing attributed bets keep their snapshot rate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="affiliate-rate">Affiliate rate (%)</FieldLabel>
              <Input
                id="affiliate-rate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="affiliate-reason">Reason (optional)</FieldLabel>
              <Input
                id="affiliate-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={() => updateRate()}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
