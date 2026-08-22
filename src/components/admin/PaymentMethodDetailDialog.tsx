import { useId, useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiPaymentMethod, WalletFundingType } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export type PaymentMethodDetailContext = {
  requestType: WalletFundingType;
  userLabel: string;
  slipUrl?: string;
};

function methodLabel(method: ApiPaymentMethod) {
  return method.name || method.type.name;
}

function contextDescription(ctx: PaymentMethodDetailContext) {
  if (ctx.requestType === "withdraw") {
    return `Payout destination for ${ctx.userLabel}. Send the approved withdrawal to this account.`;
  }
  return `Platform receive account for ${ctx.userLabel}'s deposit. Match the slip transfer to this account.`;
}

export function PaymentMethodDetailDialog({
  open,
  onOpenChange,
  method,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: ApiPaymentMethod | null | undefined;
  context: PaymentMethodDetailContext | null;
}) {
  const addressId = useId();
  const [revealed, setRevealed] = useState(false);

  const copyAddress = async () => {
    if (!method?.address) return;
    try {
      await navigator.clipboard.writeText(method.address);
      toast.success("Account number copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const title = method ? methodLabel(method) : "Payment method";
  const description = context ? contextDescription(context) : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRevealed(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby={description ? undefined : addressId}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {!method ? (
          <p className="text-sm text-muted-foreground" id={addressId}>
            Payment method details are not available for this request.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 font-normal">
                {method.type.photo_url && (
                  <img
                    src={method.type.photo_url}
                    alt=""
                    className="h-4 w-4 rounded-sm object-cover"
                  />
                )}
                {method.type.name}
              </Badge>
              {method.is_default && (
                <Badge variant="outline" className="text-primary border-primary/40">
                  Default
                </Badge>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              {method.name && method.name !== method.type.name && (
                <div className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-muted-foreground">Label</dt>
                  <dd className="font-medium">{method.name}</dd>
                </div>
              )}
              <div className="space-y-2">
                <dt className="text-muted-foreground">Account number</dt>
                <dd>
                  <div
                    className={cn(
                      "rounded-lg border border-border/60 bg-muted/30 p-3",
                      !revealed && "select-none",
                    )}
                  >
                    <p
                      id={addressId}
                      className={cn(
                        "font-mono text-sm break-all",
                        !revealed && "blur-sm",
                      )}
                      aria-live="polite"
                    >
                      {revealed ? method.address : "••••••••••••••••"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-pressed={revealed}
                        aria-label={revealed ? "Hide account number" : "Show account number"}
                        onClick={() => setRevealed((v) => !v)}
                      >
                        {revealed ? (
                          <>
                            <EyeOff className="h-4 w-4" aria-hidden />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" aria-hidden />
                            Reveal
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label="Copy account number"
                        disabled={!revealed}
                        onClick={() => void copyAddress()}
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                        Copy
                      </Button>
                    </div>
                    {!revealed && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reveal the account number before copying or sending a payout.
                      </p>
                    )}
                  </div>
                </dd>
              </div>
            </dl>

            {context?.slipUrl && (
              <div className="rounded-lg border border-dashed border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Payment slip</p>
                <a
                  href={context.slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  Open slip in new tab
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentMethodLinkButton({
  method,
  requestType,
  userLabel,
  onOpen,
}: {
  method: ApiPaymentMethod | null | undefined;
  requestType: WalletFundingType;
  userLabel: string;
  onOpen: (method: ApiPaymentMethod, context: PaymentMethodDetailContext) => void;
}) {
  if (!method) {
    return <span className="text-muted-foreground">—</span>;
  }

  const label = methodLabel(method);
  const action =
    requestType === "withdraw"
      ? `View payout details for ${label}`
      : `View receive account details for ${label}`;

  return (
    <button
      type="button"
      className="text-left font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      aria-label={action}
      onClick={() =>
        onOpen(method, {
          requestType,
          userLabel,
        })
      }
    >
      {label}
    </button>
  );
}
