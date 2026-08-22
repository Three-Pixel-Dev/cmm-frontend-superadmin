import { useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Pencil, Power, PowerOff, Trash2, Eye } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtDate } from "@/lib/format";
import { p2pApi } from "@/lib/admin/api";
import type {
  ApiP2P,
  ApiUser,
  CreateP2PPayload,
  UpdateP2PPayload,
} from "@/lib/admin/types";
import { Spinner, ErrorState, EmptyState, StatusPill, Field, TableShell } from "./parts";
import { ConfirmDialog } from "./UsersScreen";
import { UserSearchPicker } from "./UserSearchPicker";
import { P2PCryptoDepositsPanel } from "./P2PCryptoDepositsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function fmtNum(value: string, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

const p2pRoute = getRouteApi("/_admin/p2p");

export function P2PScreen() {
  const { tab } = p2pRoute.useSearch();
  const defaultTab = tab ?? "applications";
  const pendingQ = useQuery({
    queryKey: ["admin", "p2p-applications", "pending-count"],
    queryFn: () => p2pApi.listApplications({ status: "pending", limit: 1 }),
    refetchInterval: 30_000,
  });
  const pendingCount = pendingQ.data?.meta.total ?? 0;

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="agents">Agents</TabsTrigger>
        <TabsTrigger value="applications" className="gap-1.5">
          Applications
          {pendingCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-400">
              {pendingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="crypto-deposits">Crypto deposits</TabsTrigger>
      </TabsList>
      <TabsContent value="agents">
        <P2PAgentsPanel />
      </TabsContent>
      <TabsContent value="applications">
        <P2PApplicationsPanel />
      </TabsContent>
      <TabsContent value="crypto-deposits">
        <P2PCryptoDepositsPanel />
      </TabsContent>
    </Tabs>
  );
}

function P2PAgentsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiP2P | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiP2P | null>(null);

  const agentsQ = useQuery({
    queryKey: ["admin", "p2p", search],
    queryFn: () => p2pApi.list({ search, limit: 100 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "p2p"] });

  const createM = useMutation({
    mutationFn: (body: CreateP2PPayload) => p2pApi.create(body),
    onSuccess: () => {
      toast.success("P2P agent created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateP2PPayload }) => p2pApi.update(id, body),
    onSuccess: () => {
      toast.success("P2P agent updated");
      invalidate();
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => p2pApi.remove(id),
    onSuccess: () => {
      toast.success("P2P agent removed");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Add Agent
        </Button>
      </div>

      {agentsQ.isLoading ? (
        <Spinner />
      ) : agentsQ.isError ? (
        <ErrorState message={(agentsQ.error as Error).message} onRetry={() => agentsQ.refetch()} />
      ) : (agentsQ.data?.items.length ?? 0) === 0 ? (
        <EmptyState message="No P2P agents configured yet." />
      ) : (
        <TableShell head={["Agent", "Range", "Commission", "Complete %", "Trades", "Status", ""]}>
          {agentsQ.data!.items.map((a) => (
            <tr
              key={a.id}
              className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <Link
                  to="/p2p/$p2pId"
                  params={{ p2pId: a.id }}
                  className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {a.user_name || "—"}
                </Link>
                {a.user_email && <p className="text-xs text-muted-foreground">{a.user_email}</p>}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {fmtNum(a.from_range)} – {fmtNum(a.to_range)}
              </td>
              <td className="px-4 py-3 tabular-nums">{fmtNum(a.commission_rate, 4)}%</td>
              <td className="px-4 py-3 tabular-nums">{fmtNum(a.complete_percentage)}%</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{a.trade_count}</td>
              <td className="px-4 py-3">
                <StatusPill enabled={a.is_enable} />
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      title="Actions"
                      aria-label={`Actions for ${a.user_name ?? "agent"}`}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/p2p/$p2pId"
                        params={{ p2pId: a.id }}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                        View detail
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditTarget(a)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        updateM.mutate({ id: a.id, body: { is_enable: !a.is_enable } })
                      }
                    >
                      {a.is_enable ? (
                        <>
                          <PowerOff className="h-4 w-4" /> Disable
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" /> Enable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="danger" onSelect={() => setDeleteTarget(a)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {createOpen && (
        <CreateP2PDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createM.mutate(body)}
          submitting={createM.isPending}
        />
      )}
      {editTarget && (
        <EditP2PDialog
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(body) => updateM.mutate({ id: editTarget.id, body })}
          submitting={updateM.isPending}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Remove P2P agent"
          message={`Remove the P2P agent configuration for ${deleteTarget.user_name || deleteTarget.user_email}?`}
          confirmLabel="Remove"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteM.mutate(deleteTarget.id)}
          pending={deleteM.isPending}
        />
      )}
    </div>
  );
}

function P2PApplicationsPanel() {
  const [search, setSearch] = useState("");

  const appsQ = useQuery({
    queryKey: ["admin", "p2p-applications", search],
    queryFn: () => p2pApi.listApplications({ search, status: "pending", limit: 100 }),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search applicants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {appsQ.isLoading ? (
        <Spinner />
      ) : appsQ.isError ? (
        <ErrorState message={(appsQ.error as Error).message} onRetry={() => appsQ.refetch()} />
      ) : (appsQ.data?.items.length ?? 0) === 0 ? (
        <EmptyState message="No pending P2P applications." />
      ) : (
        <TableShell
          head={["Applicant", "Contact", "Proposed %", "Submitted", ""]}
        >
          {appsQ.data!.items.map((a) => (
            <tr
              key={a.id}
              className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <p className="font-medium">{a.user_name || "—"}</p>
                {a.user_email && <p className="text-xs text-muted-foreground">{a.user_email}</p>}
                {a.note && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.note}</p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                {a.phone_number && <p>{a.phone_number}</p>}
                {a.address && <p className="line-clamp-2">{a.address}</p>}
                {a.nationality && <p>{a.nationality}</p>}
              </td>
              <td className="px-4 py-3 tabular-nums">{fmtNum(a.proposed_commission_rate, 4)}%</td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {fmtDate(a.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        title="Actions"
                        aria-label={`Actions for ${a.user_name ?? "applicant"}`}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          to="/p2p/applications/$applicationId"
                          params={{ applicationId: a.id }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                          View detail
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}

function CreateP2PDialog({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (body: CreateP2PPayload) => void;
  submitting: boolean;
}) {
  const [userId, setUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [fromRange, setFromRange] = useState("");
  const [toRange, setToRange] = useState("");
  const [commission, setCommission] = useState("");

  const submit = () => {
    if (!userId) {
      toast.error("Select a user");
      return;
    }
    const from = Number(fromRange);
    const to = Number(toRange);
    const comm = Number(commission);
    if (![from, to, comm].every(Number.isFinite)) {
      toast.error("Range and commission must be numbers");
      return;
    }
    if (to < from) {
      toast.error("To-range must be ≥ from-range");
      return;
    }
    onSubmit({
      user_id: userId,
      from_range: String(from),
      to_range: String(to),
      commission_rate: String(comm),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add P2P Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="User">
            <UserSearchPicker
              value={userId}
              selected={selectedUser}
              onSelect={(user) => {
                setUserId(user.id);
                setSelectedUser(user);
              }}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From range">
              <Input
                type="number"
                step="any"
                value={fromRange}
                onChange={(e) => setFromRange(e.target.value)}
              />
            </Field>
            <Field label="To range">
              <Input
                type="number"
                step="any"
                value={toRange}
                onChange={(e) => setToRange(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Commission rate (%)">
            <Input
              type="number"
              step="any"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditP2PDialog({
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  initial: ApiP2P;
  onClose: () => void;
  onSubmit: (body: UpdateP2PPayload) => void;
  submitting: boolean;
}) {
  const [fromRange, setFromRange] = useState(initial.from_range);
  const [toRange, setToRange] = useState(initial.to_range);
  const [commission, setCommission] = useState(initial.commission_rate);
  const [complete, setComplete] = useState(initial.complete_percentage);
  const [tradeCount, setTradeCount] = useState(String(initial.trade_count));
  const [enabled, setEnabled] = useState(initial.is_enable);

  const submit = () => {
    const from = Number(fromRange);
    const to = Number(toRange);
    if (![from, to, Number(commission), Number(complete)].every(Number.isFinite)) {
      toast.error("Numeric fields must be valid numbers");
      return;
    }
    if (to < from) {
      toast.error("To-range must be ≥ from-range");
      return;
    }
    onSubmit({
      from_range: String(from),
      to_range: String(to),
      commission_rate: String(Number(commission)),
      complete_percentage: String(Number(complete)),
      trade_count: Number(tradeCount) || 0,
      is_enable: enabled,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit P2P Agent — {initial.user_name || initial.user_email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From range">
              <Input
                type="number"
                step="any"
                value={fromRange}
                onChange={(e) => setFromRange(e.target.value)}
              />
            </Field>
            <Field label="To range">
              <Input
                type="number"
                step="any"
                value={toRange}
                onChange={(e) => setToRange(e.target.value)}
              />
            </Field>
            <Field label="Commission rate (%)">
              <Input
                type="number"
                step="any"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
            </Field>
            <Field label="Complete %">
              <Input
                type="number"
                step="any"
                value={complete}
                onChange={(e) => setComplete(e.target.value)}
              />
            </Field>
            <Field label="Trade count">
              <Input
                type="number"
                min="0"
                value={tradeCount}
                onChange={(e) => setTradeCount(e.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Agent enabled
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
