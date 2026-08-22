import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Field } from "@/components/admin/parts";
import {
  bannersApi,
  type ApiBanner,
  type CreateBannerPayload,
  type UpdateBannerPayload,
} from "@/lib/admin/api";
import { cn } from "@/lib/utils";

const MAX_BANNERS = 5;

const LINK_TYPE_LABELS: Record<"messenger" | "market", { label: string; icon: React.ReactNode }> = {
  messenger: {
    label: "Messenger / External",
    icon: <MessageCircle className="h-3.5 w-3.5" />,
  },
  market: {
    label: "Market / In-App",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
};

// ─── Banner Card ──────────────────────────────────────────────────────────────

function BannerCard({
  banner,
  index,
  total,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: {
  banner: ApiBanner;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const lt = LINK_TYPE_LABELS[banner.link_type];

  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all",
        !banner.is_active && "opacity-60",
      )}
    >
      {/* Thumbnail */}
      <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={`Banner ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Image className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Banner #{index + 1}</span>
          <Badge variant={banner.is_active ? "default" : "secondary"} className="text-xs">
            {banner.is_active ? "Active" : "Inactive"}
          </Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {lt.icon}
            {lt.label}
          </span>
        </div>
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1 truncate text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          {banner.link_url || "No link set"}
        </a>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={banner.is_active ? "Deactivate" : "Activate"}
            onClick={onToggleActive}
            className="h-7 w-7"
          >
            {banner.is_active ? (
              <ToggleRight className="h-4 w-4 text-primary" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon" title="Edit" onClick={onEdit} className="h-7 w-7">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={onDelete}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Move up"
            disabled={index === 0}
            onClick={onMoveUp}
            className="h-6 w-6"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Move down"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="h-6 w-6"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner Form Dialog ───────────────────────────────────────────────────────

function BannerFormDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ApiBanner;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? "");
  const [linkType, setLinkType] = useState<"messenger" | "market">(
    initial?.link_type ?? "market",
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        const body: UpdateBannerPayload = { image_url: imageUrl, link_url: linkUrl, link_type: linkType, is_active: isActive };
        return bannersApi.update(initial!.id, body);
      }
      const body: CreateBannerPayload = { image_url: imageUrl, link_url: linkUrl, link_type: linkType, is_active: isActive };
      return bannersApi.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success(isEdit ? "Banner updated" : "Banner created");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) { toast.error("Please upload a banner image"); return; }
    if (!linkUrl) { toast.error("Please enter a link URL"); return; }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Banner" : "Create Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <ImageUploadField
            label="Banner Image"
            hint="Recommended: 1200×400 px or similar wide aspect ratio · PNG, JPG, WEBP"
            value={imageUrl}
            onChange={setImageUrl}
          />

          <Field label="Link type">
            <div className="flex gap-3">
              {(["market", "messenger"] as const).map((t) => {
                const lt = LINK_TYPE_LABELS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLinkType(t)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      linkType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40",
                    )}
                  >
                    {lt.icon}
                    {lt.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {linkType === "messenger"
                ? "Opens in a new browser tab — use a Messenger link, website URL, etc."
                : 'Navigates inside the customer app — use a path like "/markets/abc-123".'}
            </p>
          </Field>

          <Field label="Link URL">
            <Input
              type="url"
              placeholder={
                linkType === "messenger"
                  ? "https://m.me/YourPage or https://..."
                  : "/markets/market-slug or https://..."
              }
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </Field>

          <Field label="Active">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Show this banner on the customer homepage
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum 5 active banners at a time.
            </p>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BannerManagementTab() {
  const qc = useQueryClient();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: () => bannersApi.list(false), // admin sees all (active + inactive)
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiBanner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiBanner | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      bannersApi.update(id, { is_active: isActive }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success(vars.isActive ? "Banner activated" : "Banner deactivated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => bannersApi.reorder(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= banners.length) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const items = reordered.map((b, i) => ({ id: b.id, sort_order: i }));
    reorderMutation.mutate(items);
  }

  const activeBanners = banners.filter((b) => b.is_active);
  const atMax = activeBanners.length >= MAX_BANNERS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Promotional Banners</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Up to {MAX_BANNERS} active banners appear in the customer homepage carousel.
            ({activeBanners.length}/{MAX_BANNERS} active)
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={atMax}
          title={atMax ? `Maximum ${MAX_BANNERS} active banners reached` : undefined}
          className="shrink-0 gap-2"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {atMax && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          Maximum {MAX_BANNERS} active banners reached. Deactivate or delete one to add another.
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-16 text-center text-sm text-muted-foreground">
          No banners yet. Click "Add Banner" to create your first promotional banner.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              index={index}
              total={banners.length}
              onEdit={() => setEditTarget(banner)}
              onDelete={() => setDeleteTarget(banner)}
              onToggleActive={() =>
                toggleActiveMutation.mutate({ id: banner.id, isActive: !banner.is_active })
              }
              onMoveUp={() => moveItem(index, index - 1)}
              onMoveDown={() => moveItem(index, index + 1)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {createOpen && (
        <BannerFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <BannerFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={editTarget}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This banner will be permanently removed from the homepage carousel. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
