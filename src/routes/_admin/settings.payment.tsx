import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsSection } from "@/components/admin/PaymentMethodsSection";

export const Route = createFileRoute("/_admin/settings/payment")({
  head: () => ({ meta: [{ title: "Payment — Settings — SuperCash Admin" }] }),
  component: PaymentSettingsPage,
});

function PaymentSettingsPage() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Payment methods</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Bank and mobile-money accounts customers send wallet deposits to.
        </p>
      </div>
      <PaymentMethodsSection embedded />
    </section>
  );
}
