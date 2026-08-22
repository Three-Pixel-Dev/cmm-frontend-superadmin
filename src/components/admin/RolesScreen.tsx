import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, KeySquare, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { rolesApi, modulesApi } from "@/lib/admin/api";
import { invalidateMyPermissions } from "@/lib/admin/session";
import type { ApiRole, CreateRolePayload, UpdateRolePayload } from "@/lib/admin/types";
import { Spinner, ErrorState, EmptyState, StatusPill, Field, TableShell } from "./parts";
import { ConfirmDialog, IconBtn } from "./UsersScreen";
import { useAuth } from "@/store/useAuth";

export function RolesScreen() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiRole | null>(null);
  const [modulesTarget, setModulesTarget] = useState<ApiRole | null>(null);

  const rolesQ = useQuery({ queryKey: ["admin", "roles"], queryFn: () => rolesApi.list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "roles"] });

  const createM = useMutation({
    mutationFn: (body: CreateRolePayload) => rolesApi.create(body),
    onSuccess: () => {
      toast.success("Role created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRolePayload }) =>
      rolesApi.update(id, body),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      toast.success("Role deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Roles map to module access via the RBAC chain (user → role → modules).
        </p>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Add Role
        </Button>
      </div>

      {rolesQ.isLoading ? (
        <Spinner />
      ) : rolesQ.isError ? (
        <ErrorState message={(rolesQ.error as Error).message} onRetry={() => rolesQ.refetch()} />
      ) : (rolesQ.data?.length ?? 0) === 0 ? (
        <EmptyState message="No roles yet. Create one to get started." />
      ) : (
        <TableShell head={["Role", "Description", "Users", "Modules", "Status", "Actions"]}>
          {rolesQ.data!.map((r) => (
            <tr
              key={r.id}
              className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs max-w-[260px] truncate">
                {r.description || "—"}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <UsersIcon className="h-3 w-3" /> {r.user_count}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => setModulesTarget(r)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <KeySquare className="h-3 w-3" /> {r.modules.length} module
                  {r.modules.length === 1 ? "" : "s"}
                </button>
              </td>
              <td className="px-4 py-3">
                <StatusPill enabled={r.is_enable} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <IconBtn title="Manage modules" onClick={() => setModulesTarget(r)}>
                    <KeySquare className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Edit" onClick={() => setEditTarget(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Delete" danger onClick={() => setDeleteTarget(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {createOpen && (
        <RoleFormDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={(b) => createM.mutate(b as CreateRolePayload)}
          submitting={createM.isPending}
        />
      )}
      {editTarget && (
        <RoleFormDialog
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(b) => updateM.mutate({ id: editTarget.id, body: b })}
          submitting={updateM.isPending}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete role"
          message={
            deleteTarget.user_count > 0
              ? `${deleteTarget.name} still has ${deleteTarget.user_count} user(s). Reassign them first.`
              : `Delete role "${deleteTarget.name}"?`
          }
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteM.mutate(deleteTarget.id)}
          pending={deleteM.isPending}
        />
      )}
      {modulesTarget && (
        <RoleModulesDialog
          role={modulesTarget}
          onClose={() => setModulesTarget(null)}
          onSaved={() => {
            invalidate();
            const me = useAuth.getState().user;
            if (me?.role_id === modulesTarget.id) {
              invalidateMyPermissions(qc);
            }
            setModulesTarget(null);
          }}
        />
      )}
    </div>
  );
}

function RoleFormDialog({
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  initial?: ApiRole;
  onClose: () => void;
  onSubmit: (b: CreateRolePayload | UpdateRolePayload) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.is_enable ?? true);

  const submit = () => {
    if (name.trim().length < 2) {
      toast.error("Role name is required");
      return;
    }
    onSubmit(editing ? { name, description, is_enable: enabled } : { name, description });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Role" : "Add Role"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. admin, p2p_agent"
            />
          </Field>
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Role enabled
            </label>
          )}
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

function RoleModulesDialog({
  role,
  onClose,
  onSaved,
}: {
  role: ApiRole;
  onClose: () => void;
  onSaved: () => void;
}) {
  const modulesQ = useQuery({ queryKey: ["admin", "modules"], queryFn: () => modulesApi.list() });
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(role.modules.map((m) => m.id)),
  );

  const saveM = useMutation({
    mutationFn: () => rolesApi.setModules(role.id, [...selected]),
    onSuccess: () => {
      toast.success("Module access updated");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Module access — {role.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {modulesQ.isLoading ? (
            <Spinner />
          ) : modulesQ.isError ? (
            <ErrorState
              message={(modulesQ.error as Error).message}
              onRetry={() => modulesQ.refetch()}
            />
          ) : (modulesQ.data?.length ?? 0) === 0 ? (
            <EmptyState message="No modules defined yet. Add some under Module Access." />
          ) : (
            <div className="space-y-1">
              {modulesQ.data!.map((m) => (
                <label
                  key={m.id}
                  className="flex items-start gap-3 rounded-md border border-border/50 px-3 py-2 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1">{m.code}</code>
                      {m.description ? ` — ${m.description}` : ""}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveM.mutate()} disabled={saveM.isPending || modulesQ.isLoading}>
            {saveM.isPending ? "Saving…" : `Save (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
