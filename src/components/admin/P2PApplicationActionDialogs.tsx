import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ApiP2PApplication, ApproveP2PApplicationPayload, RejectP2PApplicationPayload } from "@/lib/admin/types";
import { Field } from "./parts";

export const MIN_COMMISSION_RATE = 1;

function fmtNum(value: string, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function ApproveApplicationDialog({
  application,
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  application: ApiP2PApplication;
  open: boolean;
  onClose: () => void;
  onSubmit: (body: ApproveP2PApplicationPayload) => void;
  submitting: boolean;
}) {
  const [fromRange, setFromRange] = useState("5000");
  const [toRange, setToRange] = useState("5000000");
  const [commission, setCommission] = useState(application.proposed_commission_rate);
  const commissionNum = Number(commission);
  const commissionInvalid =
    !Number.isFinite(commissionNum) || commissionNum < MIN_COMMISSION_RATE;

  const submit = () => {
    const from = Number(fromRange);
    const to = Number(toRange);
    const comm = Number(commission);
    if (![from, to, comm].every(Number.isFinite)) {
      toast.error("All fields must be valid numbers");
      return;
    }
    if (to < from) {
      toast.error("To-range must be ≥ from-range");
      return;
    }
    if (comm < MIN_COMMISSION_RATE) {
      toast.error(`Commission rate must be at least ${MIN_COMMISSION_RATE}%`);
      return;
    }
    onSubmit({
      from_range: String(from),
      to_range: String(to),
      commission_rate: String(comm),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve — {application.user_name || application.user_email}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Set trade limits for this agent. Applicant proposed{" "}
          {fmtNum(application.proposed_commission_rate, 4)}% commission.
        </p>
        <div className="grid grid-cols-2 gap-3 py-2">
          <Field label="From range">
            <Input type="number" step="any" value={fromRange} onChange={(e) => setFromRange(e.target.value)} />
          </Field>
          <Field label="To range">
            <Input type="number" step="any" value={toRange} onChange={(e) => setToRange(e.target.value)} />
          </Field>
          <Field label="Commission rate (%)">
            <Input
              type="number"
              step="0.01"
              min={MIN_COMMISSION_RATE}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              aria-invalid={commissionInvalid}
            />
            {commissionInvalid && (
              <p className="text-xs text-destructive">Minimum commission is {MIN_COMMISSION_RATE}%.</p>
            )}
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || commissionInvalid}>
            {submitting ? "Approving…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectApplicationDialog({
  application,
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  application: ApiP2PApplication;
  open: boolean;
  onClose: () => void;
  onSubmit: (body: RejectP2PApplicationPayload) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const applicant = application.user_name || application.user_email;

  const confirmReject = () => {
    onSubmit({ reject_reason: reason || undefined });
    setConfirmOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject — {applicant}</DialogTitle>
          </DialogHeader>
          <Field label="Reason (optional)">
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={submitting}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {applicant} will be notified that their P2P agent application was rejected.
              {reason.trim() ? " Your reason will be included." : " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                confirmReject();
              }}
            >
              {submitting ? "Rejecting…" : "Reject application"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
