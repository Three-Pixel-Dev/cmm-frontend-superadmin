import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodTypesTab } from "@/components/admin/PaymentMethodTypesTab";

export const Route = createFileRoute("/_admin/settings/payment-types")({
  head: () => ({ meta: [{ title: "Payment Types — Settings — SuperCash Admin" }] }),
  component: PaymentTypesSettingsPage,
});

function PaymentTypesSettingsPage() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Payment method types</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Types appear in user and agent payment method forms.
        </p>
      </div>
      <PaymentMethodTypesTab />
    </section>
  );
}
