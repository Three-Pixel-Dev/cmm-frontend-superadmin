import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { p2pApi } from "@/lib/admin/api";
import type { ApproveP2PApplicationPayload, RejectP2PApplicationPayload } from "@/lib/admin/types";
import { P2PApplicationInfoView } from "@/components/admin/P2PApplicationInfoView";
import {
  ApproveApplicationDialog,
  RejectApplicationDialog,
} from "@/components/admin/P2PApplicationActionDialogs";
import { Spinner, ErrorState } from "./parts";

function fmtNum(value: string, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function statusBadgeClass(status: string) {
  if (status === "pending") return "border-amber-400/50 bg-amber-400/10 text-amber-400";
  if (status === "approved") return "border-yes/50 bg-yes/10 text-yes";
  if (status === "rejected") return "border-destructive/50 bg-destructive/10 text-destructive";
  return "";
}

export function P2PApplicationDetail({ applicationId }: { applicationId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const detailQ = useQuery({
    queryKey: ["admin", "p2p-application", applicationId],
    queryFn: () => p2pApi.getApplication(applicationId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "p2p-applications"] });
    qc.invalidateQueries({ queryKey: ["admin", "p2p"] });
    qc.invalidateQueries({ queryKey: ["admin", "p2p-application", applicationId] });
  };

  const approveM = useMutation({
    mutationFn: (body: ApproveP2PApplicationPayload) =>
      p2pApi.approveApplication(applicationId, body),
    onSuccess: () => {
      toast.success("Application approved");
      invalidate();
      setApproveOpen(false);
      navigate({ to: "/p2p", search: { tab: "applications" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectM = useMutation({
    mutationFn: (body: RejectP2PApplicationPayload) =>
      p2pApi.rejectApplication(applicationId, body),
    onSuccess: () => {
      toast.success("Application rejected");
      invalidate();
      setRejectOpen(false);
      navigate({ to: "/p2p", search: { tab: "applications" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const app = detailQ.data;
  const applicant = app?.user_name || app?.user_email || "Applicant";
  const isPending = app?.status === "pending";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <Link
        to="/p2p"
        search={{ tab: "applications" }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to applications
      </Link>

      {detailQ.isLoading ? (
        <Spinner />
      ) : detailQ.isError ? (
        <ErrorState message={(detailQ.error as Error).message} onRetry={() => detailQ.refetch()} />
      ) : !app ? (
        <p className="text-sm text-muted-foreground">Application not found.</p>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-5">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold">{applicant}</h1>
                <Badge variant="outline" className={statusBadgeClass(app.status)}>
                  {app.status}
                </Badge>
              </div>
              {app.user_email && (
                <p className="text-sm text-muted-foreground">{app.user_email}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted {fmtDate(app.created_at)}
                {app.proposed_commission_rate && (
                  <>
                    {" "}
                    · Proposed commission{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {fmtNum(app.proposed_commission_rate, 4)}%
                    </span>
                  </>
                )}
              </p>
            </div>
            {isPending && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-1 text-destructive border-destructive/40"
                  onClick={() => setRejectOpen(true)}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Reject
                </Button>
                <Button className="gap-1" onClick={() => setApproveOpen(true)}>
                  <Check className="h-4 w-4" aria-hidden />
                  Approve
                </Button>
              </div>
            )}
          </header>

          <P2PApplicationInfoView
            app={app}
            editablePaymentMethods={app.status === "approved" || app.status === "pending"}
          />

          {isPending && (
            <div
              className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:hidden"
              role="toolbar"
              aria-label="Application review actions"
            >
              <div className="mx-auto flex max-w-5xl gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1 text-destructive border-destructive/40"
                  onClick={() => setRejectOpen(true)}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Reject
                </Button>
                <Button className="flex-1 gap-1" onClick={() => setApproveOpen(true)}>
                  <Check className="h-4 w-4" aria-hidden />
                  Approve
                </Button>
              </div>
            </div>
          )}

          <ApproveApplicationDialog
            application={app}
            open={approveOpen}
            onClose={() => setApproveOpen(false)}
            onSubmit={(body) => approveM.mutate(body)}
            submitting={approveM.isPending}
          />
          <RejectApplicationDialog
            application={app}
            open={rejectOpen}
            onClose={() => setRejectOpen(false)}
            onSubmit={(body) => rejectM.mutate(body)}
            submitting={rejectM.isPending}
          />
        </>
      )}
    </div>
  );
}
