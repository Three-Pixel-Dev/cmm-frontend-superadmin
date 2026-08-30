import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { paymentMethodTypesApi } from "@/lib/admin/api";
import type {
  ApiPaymentMethodType,
  CreatePaymentMethodTypePayload,
  UpdatePaymentMethodTypePayload,
} from "@/lib/admin/types";
import { IconBtn } from "./UsersScreen";
import { ImageUploadField } from "./ImageUploadField";
import { EmptyState, ErrorState, Field, Spinner, StatusPill, TableShell } from "./parts";

export function PaymentMethodTypesTab() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiPaymentMethodType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiPaymentMethodType | null>(null);

  const typesQ = useQuery({
    queryKey: ["admin", "payment-method-types"],
    queryFn: () => paymentMethodTypesApi.list({ include_disabled: true }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "payment-method-types"] });

  const createM = useMutation({
    mutationFn: (body: CreatePaymentMethodTypePayload) => paymentMethodTypesApi.create(body),
    onSuccess: () => {
      toast.success("Payment type created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePaymentMethodTypePayload }) =>
      paymentMethodTypesApi.update(id, body),
    onSuccess: () => {
      toast.success("Payment type updated");
      invalidate();
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => paymentMethodTypesApi.remove(id),
    onSuccess: () => {
      toast.success("Payment type deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manage payout channel types users pick when adding payment methods.
        </p>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Add type
        </Button>
      </div>

      {typesQ.isLoading ? (
        <Spinner />
      ) : typesQ.isError ? (
        <ErrorState message={(typesQ.error as Error).message} onRetry={() => typesQ.refetch()} />
      ) : (typesQ.data?.length ?? 0) === 0 ? (
        <EmptyState message="No payment method types yet." />
      ) : (
        <TableShell head={["Type", "User selection", "P2P selection", "Actions"]}>
          {typesQ.data!.map((t) => (
            <tr
              key={t.id}
              className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {t.photo_url ? (
                    <img
                      src={t.photo_url}
                      alt=""
                      className="h-8 w-8 rounded-md border border-border/60 object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/30">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  <span className="font-medium">{t.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusPill enabled={t.is_enable} />
              </td>
              <td className="px-4 py-3">
                <StatusPill enabled={t.is_enable_for_p2p} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <IconBtn title="Edit" onClick={() => setEditTarget(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Delete" danger onClick={() => setDeleteTarget(t)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {createOpen && (
        <TypeFormDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createM.mutate(body as CreatePaymentMethodTypePayload)}
          submitting={createM.isPending}
        />
      )}
      {editTarget && (
        <TypeFormDialog
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(body) => updateM.mutate({ id: editTarget.id, body })}
          submitting={updateM.isPending}
        />
      )}
      {deleteTarget && (
        <AlertDialog open onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete payment type?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{deleteTarget.name}</strong>. Types still
                linked to user payment methods cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteM.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  deleteM.mutate(deleteTarget.id);
                }}
              >
                {deleteM.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function TypeFormDialog({
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  initial?: ApiPaymentMethodType;
  onClose: () => void;
  onSubmit: (body: CreatePaymentMethodTypePayload | UpdatePaymentMethodTypePayload) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");
  const [enabled, setEnabled] = useState(initial?.is_enable ?? false);
  const [enabledForP2P, setEnabledForP2P] = useState(initial?.is_enable_for_p2p ?? false);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    onSubmit({
      name: name.trim(),
      photo_url: photoUrl.trim() || undefined,
      is_enable: enabled,
      is_enable_for_p2p: enabledForP2P,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit payment type" : "Add payment type"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Binance" />
          </Field>
          <ImageUploadField
            label="Photo"
            value={photoUrl}
            onChange={setPhotoUrl}
            disabled={submitting}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled for user selection
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabledForP2P}
              onChange={(e) => setEnabledForP2P(e.target.checked)}
            />
            Enabled for P2P selection
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
