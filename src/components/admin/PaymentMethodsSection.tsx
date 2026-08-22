import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentMethodTypesApi, paymentMethodsApi } from "@/lib/admin/api";
import type { ApiPaymentMethod } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type FormMode = "create" | "edit";

function isFiatType(name: string) {
  return name !== "Crypto" && name !== "MetaMask";
}

export function PaymentMethodsSection({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingMethod, setEditingMethod] = useState<ApiPaymentMethod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiPaymentMethod | null>(null);

  const methodsQ = useQuery({
    queryKey: ["admin", "payment-methods", "me"],
    queryFn: () => paymentMethodsApi.listMine(),
  });

  const removeM = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.remove(id),
    onSuccess: () => {
      toast.success("Payment method removed");
      qc.invalidateQueries({ queryKey: ["admin", "payment-methods", "me"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const defaultM = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.update(id, { is_default: true }),
    onSuccess: () => {
      toast.success("Default payment method updated");
      qc.invalidateQueries({ queryKey: ["admin", "payment-methods", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const methods = methodsQ.data ?? [];

  return (
    <>
      <div className={cn(!embedded && "rounded-xl border border-border/60 bg-card p-5")}>
        <div className={cn("mb-4 flex items-center gap-3", embedded ? "justify-end" : "justify-between")}>
          {!embedded && (
            <div>
              <h2 className="text-sm font-semibold">Payment methods</h2>
              <p className="text-xs text-muted-foreground">
                Bank and mobile-money accounts customers send wallet deposits to
              </p>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFormMode("create");
              setEditingMethod(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add method
          </Button>
        </div>

        {methodsQ.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : methods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
            <p className="text-sm text-muted-foreground">No payment methods yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {methods.map((m) => (
              <PaymentMethodRow
                key={m.id}
                method={m}
                defaultPending={defaultM.isPending}
                onEdit={() => {
                  setFormMode("edit");
                  setEditingMethod(m);
                  setFormOpen(true);
                }}
                onSetDefault={() => defaultM.mutate(m.id)}
                onDelete={() => setDeleteTarget(m)}
              />
            ))}
          </ul>
        )}
      </div>

      <PaymentMethodFormDialog
        open={formOpen}
        mode={formMode}
        method={editingMethod}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          setEditingMethod(null);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers will no longer be able to send deposits to this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeM.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeM.isPending || !deleteTarget}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) removeM.mutate(deleteTarget.id);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PaymentMethodRow({
  method: m,
  defaultPending,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  method: ApiPaymentMethod;
  defaultPending: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const label = m.name || m.type.name;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            {m.type.photo_url && (
              <img src={m.type.photo_url} alt="" className="h-3.5 w-3.5 rounded-sm object-cover" />
            )}
            {m.type.name}
          </span>
          {m.is_default && (
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Default
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 font-mono text-xs text-muted-foreground",
            revealed ? "break-all" : "truncate",
          )}
        >
          {revealed ? m.address : "••••••••••••"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => setRevealed((v) => !v)}>
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        {!m.is_default && (
          <Button size="icon" variant="ghost" onClick={onSetDefault} disabled={defaultPending}>
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function PaymentMethodFormDialog({
  open,
  mode,
  method,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  mode: FormMode;
  method: ApiPaymentMethod | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const typeFieldId = useId();
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const typesQ = useQuery({
    queryKey: ["admin", "payment-method-types"],
    queryFn: () => paymentMethodTypesApi.list(),
    enabled: open,
  });
  const types = (typesQ.data ?? []).filter((t) => isFiatType(t.name));
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    if (mode === "edit" && method) {
      setSelectedTypeId(method.payment_method_type_id);
      setName(method.name ?? "");
      setAddress(method.address);
      setIsDefault(method.is_default);
    } else {
      setSelectedTypeId("");
      setName("");
      setAddress("");
      setIsDefault(false);
    }
  }, [open, mode, method]);

  useEffect(() => {
    if (!open || mode === "edit") return;
    const firstId = (typesQ.data ?? []).filter((t) => isFiatType(t.name))[0]?.id;
    if (firstId) {
      setSelectedTypeId((prev) => prev || firstId);
    }
  }, [open, mode, typesQ.data]);

  const saveM = useMutation({
    mutationFn: async () => {
      const trimmedAddress = address.trim();
      if (!selectedTypeId) throw new Error("Select a payment type");
      if (mode === "create") {
        return paymentMethodsApi.create({
          payment_method_type_id: selectedTypeId,
          address: trimmedAddress,
          name: name.trim() || undefined,
          is_default: isDefault || undefined,
        });
      }
      if (!method) throw new Error("Missing payment method");
      return paymentMethodsApi.update(method.id, {
        payment_method_type_id: selectedTypeId,
        address: trimmedAddress,
        name: name.trim() || undefined,
        is_default: isDefault,
      });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Payment method added" : "Payment method updated");
      qc.invalidateQueries({ queryKey: ["admin", "payment-methods", "me"] });
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add payment method" : "Edit payment method"}</DialogTitle>
          <DialogDescription>
            Receive account details shown to customers during wallet deposits.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!address.trim()) {
              toast.error("Address is required");
              return;
            }
            saveM.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={typeFieldId}>Type</Label>
              {typesQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger id={typeFieldId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="inline-flex items-center gap-2">
                          {t.photo_url && (
                            <img src={t.photo_url} alt="" className="h-4 w-4 rounded-sm object-cover" />
                          )}
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Main KPay" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Account number / address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="font-mono" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="pm-default"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border border-input"
            />
            <Label htmlFor="pm-default">Set as default</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveM.isPending}>
              {saveM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
