import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rolesApi, usersApi } from "@/lib/admin/api";
import { invalidateMyPermissions } from "@/lib/admin/session";
import type { ApiRole, ApiUser, CreateUserPayload, UpdateUserPayload } from "@/lib/admin/types";
import { fmtDate } from "@/lib/format";
import { useAuth } from "@/store/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  History,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, Field, Spinner, StatusPill, TableShell } from "./parts";
import { BettingHistoriesDialog } from "./users/BettingHistoriesDialog";
import { UserTransactionsDialog } from "./users/UserTransactionsDialog";

export function UsersScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null);
  const [resetTarget, setResetTarget] = useState<ApiUser | null>(null);
  // After a successful reset we surface the one-time temporary password.
  const [resetResult, setResetResult] = useState<{ user: ApiUser; password: string } | null>(null);

  const [showHistoryUserId, setShowHistoryUserId] = useState<string | null>(null);
  const [showTransactionsUser, setShowTransactionsUser] = useState<ApiUser | null>(null);

  const usersQ = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => usersApi.list({ search, limit: 100 }),
  });
  const rolesQ = useQuery({ queryKey: ["admin", "roles"], queryFn: () => rolesApi.list() });
  const roles = rolesQ.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const createM = useMutation({
    mutationFn: (body: CreateUserPayload) => usersApi.create(body),
    onSuccess: () => {
      toast.success("User created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserPayload }) =>
      usersApi.update(id, body),
    onSuccess: (_data, { id, body }) => {
      toast.success("User updated");
      invalidate();
      setEditTarget(null);
      const me = useAuth.getState().user;
      if (me?.id === id && body.role_id !== undefined) {
        invalidateMyPermissions(qc);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const resetM = useMutation({
    mutationFn: (user: ApiUser) =>
      usersApi.resetPassword(user.id).then((r) => ({ user, password: r.temporary_password })),
    onSuccess: (result) => {
      setResetTarget(null);
      setResetResult(result);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 gap-2"
          disabled={roles.length === 0}
        >
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {roles.length === 0 && !rolesQ.isLoading && (
        <p className="text-xs text-amber-400">Create a role first — every user needs one.</p>
      )}

      {usersQ.isLoading ? (
        <Spinner />
      ) : usersQ.isError ? (
        <ErrorState message={(usersQ.error as Error).message} onRetry={() => usersQ.refetch()} />
      ) : (usersQ.data?.items.length ?? 0) === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <TableShell head={["User", "Email", "Role", "Status", "Joined", "Actions"]}>
          {usersQ.data!.items.map((u) => (
            <tr
              key={u.id}
              className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-3">
                <p className="font-medium">{u.name}</p>
                {u.fullname && <p className="text-xs text-muted-foreground">{u.fullname}</p>}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" /> {u.role_name || "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusPill enabled={u.is_enable} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.created_at)}</td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      title="Actions"
                      aria-label={`Actions for ${u.name}`}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setShowHistoryUserId(u.id)}>
                      <History className="h-4 w-4" /> Betting Histories
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowTransactionsUser(u)}>
                      <Receipt className="h-4 w-4" /> Transaction History
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditTarget(u)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        updateM.mutate({ id: u.id, body: { is_enable: !u.is_enable } })
                      }
                    >
                      {u.is_enable ? (
                        <>
                          <PowerOff className="h-4 w-4" /> Disable
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" /> Enable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setResetTarget(u)}>
                      <KeyRound className="h-4 w-4" /> Reset password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="danger" onSelect={() => setDeleteTarget(u)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {showHistoryUserId && (
        <BettingHistoriesDialog
          userId={showHistoryUserId}
          open={!!showHistoryUserId}
          onClose={() => setShowHistoryUserId(null)}
        />
      )}

      {showTransactionsUser && (
        <UserTransactionsDialog
          userId={showTransactionsUser.id}
          userLabel={
            showTransactionsUser.fullname ||
            showTransactionsUser.name ||
            showTransactionsUser.email ||
            undefined
          }
          open={!!showTransactionsUser}
          onClose={() => setShowTransactionsUser(null)}
        />
      )}

      {createOpen && (
        <UserFormDialog
          roles={roles}
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createM.mutate(body as CreateUserPayload)}
          submitting={createM.isPending}
        />
      )}
      {editTarget && (
        <UserFormDialog
          key={editTarget.id}
          roles={roles}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(body) => updateM.mutate({ id: editTarget.id, body })}
          submitting={updateM.isPending}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete user"
          message={`Delete ${deleteTarget.name}? This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteM.mutate(deleteTarget.id)}
          pending={deleteM.isPending}
        />
      )}
      {resetTarget && (
        <ConfirmDialog
          title="Reset password"
          message={`Generate a new temporary password for ${resetTarget.name} (${resetTarget.email})? Their current password will stop working immediately.`}
          confirmLabel="Reset password"
          onCancel={() => setResetTarget(null)}
          onConfirm={() => resetM.mutate(resetTarget)}
          pending={resetM.isPending}
        />
      )}
      {resetResult && (
        <TempPasswordDialog
          user={resetResult.user}
          password={resetResult.password}
          onClose={() => setResetResult(null)}
        />
      )}
    </div>
  );
}

function TempPasswordDialog({
  user,
  password,
  onClose,
}: {
  user: ApiUser;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn’t copy — select and copy manually");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temporary password</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Share this one-time password with{" "}
            <span className="font-medium text-foreground">{user.name}</span>. It won’t be shown
            again — copy it now.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 select-all break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
              {password}
            </code>
            <Button variant="outline" size="icon" onClick={copy} aria-label="Copy password">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserFormDialog({
  roles,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  roles: ApiRole[];
  initial?: ApiUser;
  onClose: () => void;
  onSubmit: (body: CreateUserPayload | UpdateUserPayload) => void;
  submitting: boolean;
}) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [fullname, setFullname] = useState(initial?.fullname ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(initial?.role_id ?? roles[0]?.id ?? "");
  const [enabled, setEnabled] = useState(initial?.is_enable ?? true);

  useEffect(() => {
    setName(initial?.name ?? "");
    setFullname(initial?.fullname ?? "");
    setEmail(initial?.email ?? "");
    setPassword("");
    setRoleId(initial?.role_id ?? roles[0]?.id ?? "");
    setEnabled(initial?.is_enable ?? true);
  }, [initial, roles]);

  const submit = () => {
    if (!name.trim() || !email.trim() || !roleId) {
      toast.error("Name, email and role are required");
      return;
    }
    if (!editing && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (editing) {
      const body: UpdateUserPayload = {
        name,
        fullname,
        email,
        role_id: roleId,
        is_enable: enabled,
      };
      if (password) body.password = password;
      onSubmit(body);
    } else {
      onSubmit({ name, fullname, email, password, role_id: roleId });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Username">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Full name">
            <Input value={fullname} onChange={(e) => setFullname(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={editing ? "New password (optional)" : "Password"}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editing ? "Leave blank to keep" : ""}
            />
          </Field>
          <Field label="Role">
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger aria-label="User role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Account enabled
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

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  pending,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="py-2 text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-red-600 hover:bg-red-500" onClick={onConfirm} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IconBtn({
  title,
  onClick,
  children,
  danger,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground ${danger ? "hover:text-red-400" : "hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
