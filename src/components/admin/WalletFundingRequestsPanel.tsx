import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, Field, Spinner, TableShell } from "@/components/admin/parts";
import {
  PaymentMethodDetailDialog,
  PaymentMethodLinkButton,
  type PaymentMethodDetailContext,
} from "@/components/admin/PaymentMethodDetailDialog";
import { walletFundingApi } from "@/lib/admin/api";
import type {
  ApiPaymentMethod,
  ApiWalletFundingRequest,
  WalletFundingStatus,
  WalletFundingType,
} from "@/lib/admin/types";
import { fmtDate, fmtVks } from "@/lib/format";

function userLabel(req: ApiWalletFundingRequest) {
  return req.user?.fullname || req.user?.name || req.user?.email || req.user_id;
}

export function WalletFundingRequestsPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<WalletFundingStatus>("pending");
  const [typeFilter, setTypeFilter] = useState<"" | WalletFundingType>("");
  const [approveTarget, setApproveTarget] = useState<ApiWalletFundingRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApiWalletFundingRequest | null>(null);
  const [methodDetail, setMethodDetail] = useState<{
    method: ApiPaymentMethod;
    context: PaymentMethodDetailContext;
  } | null>(null);

  const listQ = useQuery({
    queryKey: ["admin", "wallet-funding", status, typeFilter],
    queryFn: () =>
      walletFundingApi.list({
        status,
        type: typeFilter || undefined,
        limit: 100,
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "wallet-funding"] });
  const items = listQ.data?.items ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review customer deposit slips and withdrawal payout requests. Withdrawals hold balance at
        submit time.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={status} onValueChange={(v) => setStatus(v as WalletFundingStatus)}>
          <TabsList className="w-fit justify-start self-start">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : (v as WalletFundingType))}>
          <TabsList className="w-fit justify-start self-start">
            <TabsTrigger value="all">All types</TabsTrigger>
            <TabsTrigger value="deposit">Deposits</TabsTrigger>
            <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {listQ.isLoading && <Spinner />}
      {listQ.isError && (
        <p className="text-sm text-destructive">{(listQ.error as Error).message}</p>
      )}
      {!listQ.isLoading && !listQ.isError && items.length === 0 && (
        <EmptyState message={`No ${status} funding requests.`} />
      )}

      {items.length > 0 && (
        <TableShell
          head={["User", "Type", "Amount", "Method / Slip", "Submitted", ""]}
        >
          {items.map((req) => (
            <tr key={req.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <p className="font-medium">{userLabel(req)}</p>
                {req.user?.email && (
                  <p className="text-xs text-muted-foreground">{req.user.email}</p>
                )}
              </td>
              <td className="px-4 py-3 capitalize">{req.type}</td>
              <td className="px-4 py-3 tabular-nums">{fmtVks(Number(req.amount))}</td>
              <td className="px-4 py-3 text-sm">
                {req.type === "deposit" ? (
                  <div className="space-y-1">
                    <PaymentMethodLinkButton
                      method={req.payment_method}
                      requestType={req.type}
                      userLabel={userLabel(req)}
                      onOpen={(method, context) =>
                        setMethodDetail({
                          method,
                          context: { ...context, slipUrl: req.slip_url },
                        })
                      }
                    />
                    {req.slip_url && (
                      <a
                        href={req.slip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        View slip <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                ) : (
                  <PaymentMethodLinkButton
                    method={req.payment_method}
                    requestType={req.type}
                    userLabel={userLabel(req)}
                    onOpen={(method, context) => setMethodDetail({ method, context })}
                  />
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                {fmtDate(req.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                {status === "pending" && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => setApproveTarget(req)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectTarget(req)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {approveTarget && (
        <ApproveFundingDialog
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={() => {
            invalidate();
            setApproveTarget(null);
          }}
        />
      )}
      {rejectTarget && (
        <RejectFundingDialog
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            invalidate();
            setRejectTarget(null);
          }}
        />
      )}

      <PaymentMethodDetailDialog
        open={!!methodDetail}
        onOpenChange={(open) => !open && setMethodDetail(null)}
        method={methodDetail?.method}
        context={methodDetail?.context ?? null}
      />
    </div>
  );
}

function ApproveFundingDialog({
  request,
  onClose,
  onDone,
}: {
  request: ApiWalletFundingRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(request.amount);
  const [note, setNote] = useState("");

  const approveM = useMutation({
    mutationFn: () =>
      walletFundingApi.approve(request.id, {
        approved_amount: request.type === "deposit" ? amount : undefined,
        admin_note: note || undefined,
      }),
    onSuccess: () => {
      toast.success("Funding request approved");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve {request.type}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            User: {userLabel(request)} · Requested {fmtVks(Number(request.amount))}
          </p>
          {request.type === "deposit" && (
            <Field label="Credit amount (MMK)">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          )}
          {request.type === "withdraw" && (
            <p className="text-sm">Confirm you sent {fmtVks(Number(request.amount))} to the user payout method.</p>
          )}
          <Field label="Admin note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={approveM.isPending} onClick={() => approveM.mutate()}>
            {approveM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectFundingDialog({
  request,
  onClose,
  onDone,
}: {
  request: ApiWalletFundingRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");

  const rejectM = useMutation({
    mutationFn: () => walletFundingApi.reject(request.id, { reason }),
    onSuccess: () => {
      toast.success("Funding request rejected");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {request.type}</DialogTitle>
        </DialogHeader>
        <Field label="Reason (shown to user)">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || rejectM.isPending}
            onClick={() => rejectM.mutate()}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
