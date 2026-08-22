import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fmtDate } from "@/lib/format";
import { incomePreferenceLabel } from "@/lib/admin/p2pApplicationLabels";
import { P2PApplicationPaymentMethodsSection } from "@/components/admin/P2PApplicationPaymentMethodsSection";
import type { ApiP2PApplication } from "@/lib/admin/types";
import { NrcPhotoReview } from "@/components/admin/NrcPhotoReview";

function fmtNum(value: string, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground break-words">{value}</dd>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</h3>
      <p className="text-sm whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}

function statusBadgeClass(status: string) {
  if (status === "pending") return "border-amber-400/50 bg-amber-400/10 text-amber-400";
  if (status === "approved") return "border-yes/50 bg-yes/10 text-yes";
  if (status === "rejected") return "border-destructive/50 bg-destructive/10 text-destructive";
  return "";
}

export function P2PApplicationInfoView({
  app,
  editablePaymentMethods = false,
}: {
  app: ApiP2PApplication;
  editablePaymentMethods?: boolean;
}) {
  const applicant = app.user_name || app.user_email || "Applicant";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">Application summary</h2>
          <Badge variant="outline" className={statusBadgeClass(app.status)}>
            {app.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Submitted {fmtDate(app.created_at)}
          {app.reviewed_at && <> · Reviewed {fmtDate(app.reviewed_at)}</>}
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

      <NrcPhotoReview
        frontUrl={app.nrc_front_url}
        backUrl={app.nrc_back_url}
        applicantName={applicant}
        nrcText={app.nrc}
      />

      <section
        className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="agent-app-identity-heading"
      >
        <h2 id="agent-app-identity-heading" className="mb-4 text-base font-semibold">
          Identity & contact
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Email" value={app.user_email} />
          <DetailField label="Phone" value={app.phone_number} />
          <DetailField label="Nationality" value={app.nationality} />
          <DetailField label="Passport" value={app.passport} />
          <DetailField label="Address" value={app.address} />
        </dl>
      </section>

      <section
        className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="agent-app-capital-heading"
      >
        <h2 id="agent-app-capital-heading" className="mb-4 text-base font-semibold">
          Capital & income
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Working capital"
            value={app.working_capital ? fmtNum(app.working_capital) : undefined}
          />
          <DetailField
            label="Income preference"
            value={incomePreferenceLabel(app.income_preference)}
          />
        </dl>
      </section>

      <P2PApplicationPaymentMethodsSection app={app} editable={editablePaymentMethods} />

      <section
        className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="agent-app-details-heading"
      >
        <h2 id="agent-app-details-heading" className="mb-4 text-base font-semibold">
          Application details
        </h2>
        <div className="space-y-4">
          <TextBlock label="Previous experience" value={app.previous_experience} />
          <TextBlock label="Purpose of application" value={app.application_purpose} />
          <TextBlock label="Note" value={app.note} />
          {app.reject_reason && (
            <>
              <Separator />
              <TextBlock label="Reject reason" value={app.reject_reason} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
