import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { paymentMethodTypesApi, p2pApi } from "@/lib/admin/api";
import {
  fiatPaymentMethodTypes,
  mergeSelectedPaymentTypes,
} from "@/lib/admin/paymentMethodTypeFilters";
import { paymentMethodsLabel } from "@/lib/admin/p2pApplicationLabels";
import type { ApiP2PApplication, UpdateApplicationPaymentMethodsPayload } from "@/lib/admin/types";
import { PaymentMethodMultiSelect } from "@/components/admin/PaymentMethodMultiSelect";

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground break-words">{value}</dd>
    </div>
  );
}

export function P2PApplicationPaymentMethodsSection({
  app,
  editable = false,
}: {
  app: ApiP2PApplication;
  editable?: boolean;
}) {
  const qc = useQueryClient();
  const canEdit = editable && (app.status === "approved" || app.status === "pending");
  const [editing, setEditing] = useState(false);
  const [platformIds, setPlatformIds] = useState(app.platform_purchase_payment_methods ?? []);
  const [userTradeIds, setUserTradeIds] = useState(app.user_trade_payment_methods ?? []);

  const labelsQ = useQuery({
    queryKey: ["admin", "payment-method-types", "labels"],
    queryFn: () => paymentMethodTypesApi.list({ include_disabled: true }),
  });
  const p2pTypesQ = useQuery({
    queryKey: ["admin", "payment-method-types", "p2p"],
    queryFn: () => paymentMethodTypesApi.list({ for_p2p: true }),
    enabled: editing,
  });
  const userTypesQ = useQuery({
    queryKey: ["admin", "payment-method-types", "user"],
    queryFn: () => paymentMethodTypesApi.list(),
    enabled: editing,
  });

  useEffect(() => {
    if (editing) return;
    setPlatformIds(app.platform_purchase_payment_methods ?? []);
    setUserTradeIds(app.user_trade_payment_methods ?? []);
  }, [app, editing]);

  const paymentTypes = labelsQ.data ?? [];
  const platformOptions = mergeSelectedPaymentTypes(
    fiatPaymentMethodTypes(p2pTypesQ.data ?? []),
    fiatPaymentMethodTypes(labelsQ.data ?? []),
    platformIds,
  );
  const userTradeOptions = mergeSelectedPaymentTypes(
    fiatPaymentMethodTypes(userTypesQ.data ?? []),
    fiatPaymentMethodTypes(labelsQ.data ?? []),
    userTradeIds,
  );

  const saveM = useMutation({
    mutationFn: (body: UpdateApplicationPaymentMethodsPayload) =>
      p2pApi.updateApplicationPaymentMethods(app.id, body),
    onSuccess: (updated) => {
      toast.success("Payment method types updated");
      qc.setQueryData(["admin", "p2p-application", app.id], updated);
      qc.setQueryData(["admin", "p2p-application", "by-user", app.user_id], updated);
      qc.invalidateQueries({ queryKey: ["admin", "p2p-applications"] });
      setPlatformIds(updated.platform_purchase_payment_methods ?? []);
      setUserTradeIds(updated.user_trade_payment_methods ?? []);
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = () => {
    if (platformIds.length === 0 || userTradeIds.length === 0) {
      toast.error("Select at least one payment type in each list");
      return;
    }
    saveM.mutate({
      platform_purchase_payment_methods: platformIds,
      user_trade_payment_methods: userTradeIds,
    });
  };

  return (
    <section
      className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
      aria-labelledby="agent-app-payment-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="agent-app-payment-heading" className="text-base font-semibold">
            Payment method types
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Types this agent may add payout addresses for. Crypto is managed separately under Crypto
            wallet.
          </p>
        </div>
        {canEdit && !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit types
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Platform purchase (P2P selection)
              </p>
              {p2pTypesQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <PaymentMethodMultiSelect
                  options={platformOptions}
                  value={platformIds}
                  onChange={setPlatformIds}
                  disabled={saveM.isPending}
                  emptyLabel="No P2P-enabled payment types. Enable types under Settings → Payment types."
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                User trade (User selection)
              </p>
              {userTypesQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <PaymentMethodMultiSelect
                  options={userTradeOptions}
                  value={userTradeIds}
                  onChange={setUserTradeIds}
                  disabled={saveM.isPending}
                  emptyLabel="No user-enabled payment types. Enable types under Settings → Payment types."
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saveM.isPending}>
              {saveM.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save payment types
            </Button>
            <Button
              variant="outline"
              disabled={saveM.isPending}
              onClick={() => {
                setPlatformIds(app.platform_purchase_payment_methods ?? []);
                setUserTradeIds(app.user_trade_payment_methods ?? []);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label="Platform purchase payment"
            value={paymentMethodsLabel(app.platform_purchase_payment_methods, paymentTypes)}
          />
          <DetailField
            label="User trade payment"
            value={paymentMethodsLabel(app.user_trade_payment_methods, paymentTypes)}
          />
        </dl>
      )}
    </section>
  );
}
