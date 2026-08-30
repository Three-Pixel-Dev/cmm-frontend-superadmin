import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { marketCategoriesApi } from "@/lib/admin/api";
import type {
  ApiMarketCategory,
  CreateMarketCategoryPayload,
  UpdateMarketCategoryPayload,
} from "@/types/market";
import { IconBtn } from "../UsersScreen";
import { EmptyState, ErrorState, Field, Spinner, StatusPill, TableShell } from "../parts";

export function MarketCategoriesSection() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiMarketCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiMarketCategory | null>(null);

  const categoriesQ = useQuery({
    queryKey: ["admin", "market-categories"],
    queryFn: () => marketCategoriesApi.list({ include_disabled: true }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "market-categories"] });

  const createM = useMutation({
    mutationFn: (body: CreateMarketCategoryPayload) => marketCategoriesApi.create(body),
    onSuccess: () => {
      toast.success("Category created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMarketCategoryPayload }) =>
      marketCategoriesApi.update(id, body),
    onSuccess: () => {
      toast.success("Category updated");
      invalidate();
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => marketCategoriesApi.remove(id),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Group prediction markets for the customer homepage category chips.
        </p>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      {categoriesQ.isLoading ? (
        <Spinner />
      ) : categoriesQ.isError ? (
        <ErrorState
          message={(categoriesQ.error as Error).message}
          onRetry={() => categoriesQ.refetch()}
        />
      ) : (categoriesQ.data?.length ?? 0) === 0 ? (
        <EmptyState message="No market categories yet." />
      ) : (
        <TableShell head={["Slug", "Title (EN)", "Title (MY)", "Order", "Enabled", "Actions"]}>
          {categoriesQ.data!.map((c) => (
            <tr
              key={c.id}
              className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
              <td className="px-4 py-3 font-medium">{c.title_en}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.title_my || "—"}</td>
              <td className="px-4 py-3 tabular-nums">{c.sort_order}</td>
              <td className="px-4 py-3">
                <StatusPill enabled={c.is_enable} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <IconBtn title="Edit" onClick={() => setEditTarget(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Delete" danger onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {createOpen && (
        <CategoryFormDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createM.mutate(body as CreateMarketCategoryPayload)}
          submitting={createM.isPending}
        />
      )}
      {editTarget && (
        <CategoryFormDialog
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
              <AlertDialogTitle>Delete category?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{deleteTarget.title_en}</strong>. Categories
                still linked to markets cannot be deleted.
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

function CategoryFormDialog({
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  initial?: ApiMarketCategory;
  onClose: () => void;
  onSubmit: (body: CreateMarketCategoryPayload | UpdateMarketCategoryPayload) => void;
  submitting: boolean;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [titleMy, setTitleMy] = useState(initial?.title_my ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [enabled, setEnabled] = useState(initial?.is_enable ?? true);

  const submit = () => {
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!titleEn.trim()) {
      toast.error("English title is required");
      return;
    }
    const order = Number.parseInt(sortOrder, 10);
    onSubmit({
      slug: slug.trim(),
      title_en: titleEn.trim(),
      title_my: titleMy.trim() || undefined,
      sort_order: Number.isFinite(order) ? order : 0,
      is_enable: enabled,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Slug">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="general" />
          </Field>
          <Field label="Title (EN)">
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </Field>
          <Field label="Title (MY)">
            <Input value={titleMy} onChange={(e) => setTitleMy(e.target.value)} />
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enabled for customers
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
