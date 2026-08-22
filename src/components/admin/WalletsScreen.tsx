import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, MoreHorizontal, Plus, Wallet as WalletIcon, Coins, Sparkles } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtDate } from "@/lib/format";
import { walletsApi } from "@/lib/admin/api";
import type { AdjustWalletPayload, ApiUser, ApiWallet, CreateWalletPayload } from "@/lib/admin/types";
import { UserSearchPicker } from "@/components/admin/UserSearchPicker";
import { Spinner, ErrorState, EmptyState, StatusPill, Field, TableShell } from "./parts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletFundingRequestsPanel } from "@/components/admin/WalletFundingRequestsPanel";

// Wallet balances are credit amounts (not USD), so format them directly with
// thousands separators rather than the mock USD→MMK helper.
function fmtAmount(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function WalletsScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<ApiWallet | null>(null);

  const walletsQ = useQuery({
    queryKey: ["admin", "wallets", search],
    queryFn: () => walletsApi.list({ search, limit: 100 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "wallets"] });

  const createM = useMutation({
    mutationFn: (body: CreateWalletPayload) => walletsApi.create(body),
    onSuccess: () => {
      toast.success("Wallet created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdjustWalletPayload }) =>
      walletsApi.adjust(id, body),
    onSuccess: () => {
      toast.success("Wallet adjusted");
      invalidate();
      setAdjustTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const existingUserIds = (walletsQ.data?.items ?? []).map((w) => w.user_id);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="wallets">
        <TabsList className="w-fit justify-start self-start">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="funding">Funding requests</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="mt-4 space-y-4">
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
          <Plus className="h-4 w-4" /> Create wallet
        </Button>
      </div>

      {walletsQ.isLoading ? (
        <Spinner />
      ) : walletsQ.isError ? (
        <ErrorState
          message={(walletsQ.error as Error).message}
          onRetry={() => walletsQ.refetch()}
        />
      ) : (walletsQ.data?.items.length ?? 0) === 0 ? (
        <EmptyState message="No wallets found." />
      ) : (
        <TableShell head={["User", "Real balance", "Virtual balance", "Status", "Updated", ""]}>
          {walletsQ.data!.items.map((w) => (
            <tr
              key={w.id}
              className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <p className="font-medium">{w.user_name || "—"}</p>
                {w.user_email && <p className="text-xs text-muted-foreground">{w.user_email}</p>}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  {fmtAmount(w.amount)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  {fmtAmount(w.virtual_amount)}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusPill enabled={w.is_enable} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(w.updated_at)}</td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      title="Actions"
                      aria-label={`Actions for ${w.user_name ?? "wallet"}`}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setAdjustTarget(w)}>
                      <WalletIcon className="h-4 w-4" /> Adjust balance
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {adjustTarget && (
        <AdjustWalletDialog
          wallet={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSubmit={(body) => adjustM.mutate({ id: adjustTarget.id, body })}
          submitting={adjustM.isPending}
        />
      )}

      {createOpen && (
        <CreateWalletDialog
          excludeUserIds={existingUserIds}
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createM.mutate(body)}
          submitting={createM.isPending}
        />
      )}
        </TabsContent>

        <TabsContent value="funding" className="mt-4">
          <WalletFundingRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateWalletDialog({
  excludeUserIds,
  onClose,
  onSubmit,
  submitting,
}: {
  excludeUserIds: string[];
  onClose: () => void;
  onSubmit: (body: CreateWalletPayload) => void;
  submitting: boolean;
}) {
  const [userId, setUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [realAmount, setRealAmount] = useState("");
  const [virtualAmount, setVirtualAmount] = useState("");

  const submit = () => {
    if (!userId) {
      toast.error("Select a user");
      return;
    }
    const body: CreateWalletPayload = { user_id: userId };
    if (realAmount.trim() !== "") {
      const n = Number(realAmount);
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Real balance must be a non-negative number");
        return;
      }
      body.amount = String(n);
    }
    if (virtualAmount.trim() !== "") {
      const n = Number(virtualAmount);
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Virtual balance must be a non-negative number");
        return;
      }
      body.virtual_amount = String(n);
    }
    onSubmit(body);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="User">
            <UserSearchPicker
              value={userId}
              selected={selectedUser}
              excludeUserIds={excludeUserIds}
              placeholder="Select a user without a wallet…"
              onSelect={(user) => {
                setUserId(user.id);
                setSelectedUser(user);
              }}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Users who already have a wallet are hidden from this list.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Initial real balance (optional)">
              <Input
                type="number"
                min="0"
                step="any"
                value={realAmount}
                onChange={(e) => setRealAmount(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Initial virtual balance (optional)">
              <Input
                type="number"
                min="0"
                step="any"
                value={virtualAmount}
                onChange={(e) => setVirtualAmount(e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustWalletDialog({
  wallet,
  onClose,
  onSubmit,
  submitting,
}: {
  wallet: ApiWallet;
  onClose: () => void;
  onSubmit: (body: AdjustWalletPayload) => void;
  submitting: boolean;
}) {
  const [ledger, setLedger] = useState<"real" | "virtual">("real");
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const current = ledger === "real" ? wallet.amount : wallet.virtual_amount;

  const submit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    const delta = mode === "debit" ? -value : value;
    onSubmit({ ledger, delta: String(delta), reason: reason.trim() || undefined });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust wallet — {wallet.user_name || wallet.user_email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Ledger">
            <select
              value={ledger}
              onChange={(e) => setLedger(e.target.value as "real" | "virtual")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="real">Real</option>
              <option value="virtual">Virtual</option>
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">
            Current {ledger} balance:{" "}
            <span className="font-medium text-foreground tabular-nums">{fmtAmount(current)}</span>
          </p>
          <Field label="Direction">
            <div className="flex gap-2">
              {(["credit", "debit"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    mode === m
                      ? m === "credit"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/40 bg-red-500/10 text-red-400"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {m === "credit" ? "Credit (+)" : "Debit (−)"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Reason (optional)">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. manual refill"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
