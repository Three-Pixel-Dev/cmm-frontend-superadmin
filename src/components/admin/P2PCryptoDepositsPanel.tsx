import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, Field, Spinner, TableShell } from "@/components/admin/parts";
import { p2pApi } from "@/lib/admin/api";
import type { ApiCryptoDeposit, CryptoDepositStatus } from "@/lib/admin/types";
import { fmtDate } from "@/lib/format";
import { DEFAULT_CHAIN_ID, getChain } from "@/lib/web3/chains";
import { cn } from "@/lib/utils";

function agentLabel(req: ApiCryptoDeposit) {
  return req.agent.name || req.agent.email || req.agent_user_id;
}

const STATUS_STYLES: Record<CryptoDepositStatus, string> = {
  approving: "bg-sky-500/15 text-sky-400",
  pending: "bg-amber-500/15 text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

export function P2PCryptoDepositsPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<CryptoDepositStatus>("pending");
  const [approveTarget, setApproveTarget] = useState<ApiCryptoDeposit | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApiCryptoDeposit | null>(null);
  const [detail, setDetail] = useState<ApiCryptoDeposit | null>(null);

  const listQ = useQuery({
    queryKey: ["admin", "p2p-crypto-deposits", status],
    queryFn: () => p2pApi.listCryptoDeposits({ status, limit: 100 }),
    refetchInterval: status === "approving" ? 4_000 : 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "p2p-crypto-deposits"] });

  const items = listQ.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Agents send USDT to the platform wallet. Verify the on-chain transaction, then approve
          with the MMK amount to credit their wallet.
        </p>
        <Tabs value={status} onValueChange={(v) => setStatus(v as CryptoDepositStatus)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approving">Approving</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {listQ.isLoading && <Spinner />}
      {listQ.isError && (
        <p className="text-sm text-destructive">{(listQ.error as Error).message}</p>
      )}
      {!listQ.isLoading && !listQ.isError && items.length === 0 && (
        <EmptyState message={`No ${status} crypto deposits.`} />
      )}

      {items.length > 0 && (
        <TableShell
          head={["Agent", "USDT", "Network", "Tx hash", "MMK", "Status", "Submitted", ""]}
        >
          {items.map((req) => {
            const chain = getChain(req.chain_id ?? DEFAULT_CHAIN_ID);
            return (
              <tr
                key={req.id}
                className="border-b border-border/40 hover:bg-muted/20 cursor-pointer"
                onClick={() => setDetail(req)}
              >
                <td className="px-4 py-3 font-medium">{agentLabel(req)}</td>
                <td className="px-4 py-3 tabular-nums">{req.usdt_amount}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {chain?.shortName ?? req.chain_id}
                </td>
                <td className="px-4 py-3">
                  {req.meta_mask_trx_id && chain ? (
                    <a
                      href={chain.explorerTxUrl(req.meta_mask_trx_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {req.meta_mask_trx_id.slice(0, 10)}…
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : req.status === "approving" ? (
                    <span className="text-xs text-muted-foreground">Awaiting transfer</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {req.mmk_amount ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                      STATUS_STYLES[req.status],
                    )}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {fmtDate(req.created_at)}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {req.status === "pending" && (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-yes border-yes/40"
                        onClick={() => setApproveTarget(req)}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive border-destructive/40"
                        onClick={() => setRejectTarget(req)}
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      {approveTarget && (
        <ApproveDepositDialog
          deposit={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={() => {
            invalidate();
            setApproveTarget(null);
            setDetail(null);
          }}
        />
      )}

      {rejectTarget && (
        <RejectDepositDialog
          deposit={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            invalidate();
            setRejectTarget(null);
            setDetail(null);
          }}
        />
      )}

      {detail && (
        <DepositDetailDialog deposit={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function ApproveDepositDialog({
  deposit,
  onClose,
  onDone,
}: {
  deposit: ApiCryptoDeposit;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mmkAmount, setMmkAmount] = useState("");

  const approveM = useMutation({
    mutationFn: () => p2pApi.approveCryptoDeposit(deposit.id, { mmk_amount: mmkAmount }),
    onSuccess: () => {
      toast.success("Deposit approved — agent wallet credited");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const chain = getChain(deposit.chain_id ?? DEFAULT_CHAIN_ID);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve crypto deposit</DialogTitle>
          <DialogDescription>
            Verify {deposit.usdt_amount} USDT from {agentLabel(deposit)} on-chain, then enter the
            platform Kyat amount to credit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Tx: </span>
            {deposit.meta_mask_trx_id && chain ? (
              <a
                href={chain.explorerTxUrl(deposit.meta_mask_trx_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline break-all"
              >
                {deposit.meta_mask_trx_id}
              </a>
            ) : (
              <span className="text-muted-foreground">Not detected yet</span>
            )}
          </p>
          <Field label="MMK credit amount">
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={mmkAmount}
              onChange={(e) => setMmkAmount(e.target.value)}
              placeholder="Platform currency to credit"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={approveM.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => approveM.mutate()}
            disabled={approveM.isPending || parseFloat(mmkAmount) <= 0}
          >
            {approveM.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Approving…
              </>
            ) : (
              "Approve & credit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDepositDialog({
  deposit,
  onClose,
  onDone,
}: {
  deposit: ApiCryptoDeposit;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");

  const rejectM = useMutation({
    mutationFn: () =>
      p2pApi.rejectCryptoDeposit(deposit.id, { reject_reason: reason.trim() || undefined }),
    onSuccess: () => {
      toast.success("Deposit rejected");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject deposit</DialogTitle>
          <DialogDescription>
            Reject {deposit.usdt_amount} USDT deposit from {agentLabel(deposit)}.
          </DialogDescription>
        </DialogHeader>
        <Field label="Reason (optional)">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={rejectM.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => rejectM.mutate()} disabled={rejectM.isPending}>
            {rejectM.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepositDetailDialog({
  deposit,
  onClose,
}: {
  deposit: ApiCryptoDeposit;
  onClose: () => void;
}) {
  const chain = getChain(deposit.chain_id ?? DEFAULT_CHAIN_ID);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crypto deposit — {agentLabel(deposit)}</DialogTitle>
        </DialogHeader>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">USDT</dt>
            <dd className="font-medium tabular-nums">{deposit.usdt_amount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Network</dt>
            <dd>{chain?.name ?? deposit.chain_id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{deposit.status}</dd>
          </div>
          {deposit.mmk_amount && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">MMK credited</dt>
              <dd className="tabular-nums">{deposit.mmk_amount}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Platform address</dt>
            <dd className="mt-1 font-mono text-xs break-all">{deposit.platform_address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Transaction</dt>
            <dd className="mt-1 font-mono text-xs break-all">
              {deposit.meta_mask_trx_id ?? "Awaiting on-chain transfer"}
            </dd>
          </div>
          {deposit.approving_expires_at && deposit.status === "approving" && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Expires</dt>
              <dd>{fmtDate(deposit.approving_expires_at)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Submitted</dt>
            <dd>{fmtDate(deposit.created_at)}</dd>
          </div>
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
