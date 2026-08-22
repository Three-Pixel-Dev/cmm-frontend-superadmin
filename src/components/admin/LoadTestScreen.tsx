import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Copy, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadTestApi, type CreateLoadTestRunPayload } from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STEPS = ["Configure", "Seed markets", "Seed users", "Mint tokens", "Run CLI", "Cleanup"] as const;

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function LoadTestScreen() {
  const user = useAuth((s) => s.user);
  const isSuperAdmin = user?.role_name?.toLowerCase() === "super_admin";
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateLoadTestRunPayload>({
    run_id: `10k-${new Date().toISOString().slice(0, 10)}`,
    gateway_url: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    concurrency: 120,
    players: 10000,
    market_count: 10,
    wallet_balance: 10_000_000,
    think_min_ms: 500,
    think_max_ms: 3000,
    duration: "30m",
    seed_yes_count: 1000,
    seed_no_count: 500,
  });
  const [activeRunId, setActiveRunId] = useState(form.run_id);
  const [confirmProd, setConfirmProd] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState("");
  const [forceReseedMarkets, setForceReseedMarkets] = useState(false);

  const runQ = useQuery({
    queryKey: ["load-test", activeRunId],
    queryFn: () => loadTestApi.getRun(activeRunId),
    enabled: !!activeRunId && isSuperAdmin,
    retry: false,
  });

  useEffect(() => {
    const run = runQ.data;
    if (!run) return;
    setForm((prev) => ({
      ...prev,
      run_id: run.run_id,
      gateway_url: run.gateway_url,
      concurrency: run.concurrency,
      players: run.players,
      market_count: run.market_count,
      wallet_balance: run.wallet_balance,
      think_min_ms: run.think_min_ms,
      think_max_ms: run.think_max_ms,
      duration: run.duration,
      seed_yes_count: run.seed_yes_count,
      seed_no_count: run.seed_no_count,
    }));
  }, [runQ.data?.run_id, runQ.data?.updated_at]);

  const createM = useMutation({
    mutationFn: () => loadTestApi.createRun(form),
    onSuccess: (run) => {
      setActiveRunId(run.run_id);
      queryClient.invalidateQueries({ queryKey: ["load-test", run.run_id] });
      toast.success("Run configured");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedMarketsM = useMutation({
    mutationFn: () =>
      loadTestApi.seedMarkets(activeRunId, forceReseedMarkets, {
        seed_yes_count: form.seed_yes_count,
        seed_no_count: form.seed_no_count,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-test", activeRunId] });
      toast.success(forceReseedMarkets ? "Markets re-seeded (liquidity applied)" : "Markets seeded");
      setForceReseedMarkets(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedUsersM = useMutation({
    mutationFn: () => loadTestApi.seedUsers(activeRunId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-test", activeRunId] });
      toast.success("Users and wallets seeded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mintM = useMutation({
    mutationFn: () => loadTestApi.mintTokens(activeRunId),
    onSuccess: (res) => {
      downloadJson(`loadtest-${activeRunId}-tokens.json`, res);
      queryClient.invalidateQueries({ queryKey: ["load-test", activeRunId] });
      toast.success(`Downloaded ${res.count} JWT tokens`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const marketsFileM = useMutation({
    mutationFn: () => loadTestApi.marketsFile(activeRunId),
    onSuccess: (res) => {
      downloadJson(`loadtest-${activeRunId}-markets.json`, res);
      toast.success("Markets file downloaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cliM = useQuery({
    queryKey: ["load-test", activeRunId, "cli"],
    queryFn: () => loadTestApi.cliCommand(activeRunId),
    enabled: !!activeRunId && isSuperAdmin && !!runQ.data,
  });

  const cleanupM = useMutation({
    mutationFn: () => loadTestApi.cleanup(activeRunId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["load-test", activeRunId] });
      const failed = res.markets_failed ?? 0;
      if (failed > 0) {
        toast.warning(
          `Cleanup partial: ${res.users_deleted} users, ${res.markets_deleted} markets deleted, ${failed} markets failed`,
        );
      } else {
        toast.success(`Cleanup done (${res.users_deleted} users, ${res.markets_deleted} markets)`);
      }
      setConfirmCleanup("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stepIndex = useMemo(() => {
    const st = runQ.data?.status;
    if (!st || st === "configured") return 0;
    if (st === "markets_seeded") return 2;
    if (st === "users_seeded") return 3;
    if (st === "tokens_minted") return 4;
    if (st === "cleaned") return 5;
    return 0;
  }, [runQ.data?.status]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Load test dashboard is restricted to super_admin.
      </div>
    );
  }

  const isProdUrl = !form.gateway_url.includes("localhost") && !form.gateway_url.includes("127.0.0.1");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Production load test</h1>
        <p className="text-sm text-muted-foreground">
          Hidden testing tool — seed 10 markets + 10k users, then run the CLI worker with gateway JWTs.
        </p>
      </div>

      <Panel
        title="Safety"
        className="border-amber-500/40 bg-amber-500/5"
        description="Use a Neon branch, not production main DB. Enable LOAD_TEST_ENABLED=true on user-service."
      >
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          Seed and cleanup write users, wallets, markets, and bets.
        </p>
      </Panel>

      <div className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 ${i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <Panel title="1. Configure run" description="Create run metadata (does not seed yet).">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="run_id">Run ID</Label>
            <Input
              id="run_id"
              value={form.run_id}
              onChange={(e) => setForm({ ...form, run_id: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gateway_url">Gateway URL</Label>
            <Input
              id="gateway_url"
              value={form.gateway_url}
              onChange={(e) => setForm({ ...form, gateway_url: e.target.value })}
            />
            {isProdUrl && (
              <label className="flex items-center gap-2 text-sm text-amber-700">
                <input type="checkbox" checked={confirmProd} onChange={(e) => setConfirmProd(e.target.checked)} />
                I confirm this targets a non-production or branch stack
              </label>
            )}
          </div>
          <div className="space-y-2">
            <Label>Concurrency (100–500)</Label>
            <Input
              type="number"
              min={100}
              max={500}
              value={form.concurrency}
              onChange={(e) => setForm({ ...form, concurrency: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Players</Label>
            <Input
              type="number"
              value={form.players}
              onChange={(e) => setForm({ ...form, players: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Markets</Label>
            <Input
              type="number"
              value={form.market_count}
              onChange={(e) => setForm({ ...form, market_count: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Wallet balance (MMK)</Label>
            <Input
              type="number"
              value={form.wallet_balance}
              onChange={(e) => setForm({ ...form, wallet_balance: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Seed Yes shares (platform liquidity)</Label>
            <Input
              type="number"
              min={0}
              value={form.seed_yes_count ?? 1000}
              onChange={(e) => setForm({ ...form, seed_yes_count: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Seed No shares</Label>
            <Input
              type="number"
              min={0}
              value={form.seed_no_count ?? 500}
              onChange={(e) => setForm({ ...form, seed_no_count: Number(e.target.value) })}
            />
          </div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            Bots and manual bets need opposing pool liquidity. Default 1000/500 is a 2:1 Yes/No seed ratio
            (pool ≈ K 1.5M at K 1,000/share). Both counts cannot be zero. Seed markets uses the values above
            (Save run config is optional).
          </p>
          <div className="sm:col-span-2">
            <Button
              onClick={() => createM.mutate()}
              disabled={createM.isPending || (isProdUrl && !confirmProd)}
            >
              Save run config
            </Button>
          </div>
        </div>
      </Panel>

      {runQ.data && (
        <Panel
          title={`Run status: ${runQ.data.run_id}`}
          description={`${runQ.data.status} · ${runQ.data.markets_seeded}/${runQ.data.market_count} markets · ${runQ.data.users_seeded}/${runQ.data.players} users · seed ${runQ.data.seed_yes_count}/${runQ.data.seed_no_count} yes/no shares`}
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => seedMarketsM.mutate()} disabled={seedMarketsM.isPending}>
              2. Seed markets
            </Button>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={forceReseedMarkets}
                onChange={(e) => setForceReseedMarkets(e.target.checked)}
              />
              Force re-seed (delete existing test markets first)
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => seedUsersM.mutate()} disabled={seedUsersM.isPending}>
              3. Seed users + wallets
            </Button>
            <Button variant="secondary" onClick={() => marketsFileM.mutate()} disabled={marketsFileM.isPending}>
              <Download className="mr-2 size-4" />
              Markets JSON
            </Button>
            <Button variant="secondary" onClick={() => mintM.mutate()} disabled={mintM.isPending}>
              <Download className="mr-2 size-4" />
              4. Mint + download JWTs
            </Button>
          </div>
        </Panel>
      )}

      {cliM.data?.command && (
        <Panel
          title="5. Run CLI on VM / your machine"
          description={`Sustained ${runQ.data?.concurrency} concurrent bettors through gateway + Bearer JWT.`}
        >
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{cliM.data.command}</pre>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void navigator.clipboard.writeText(cliM.data!.command);
              toast.success("Copied CLI command");
            }}
          >
            <Copy className="mr-2 size-4" />
            Copy command
          </Button>
        </Panel>
      )}

      <Panel
        title="6. Cleanup"
        description="Deletes loadtest users, bets, transactions, and test markets (including orphans matched by slug loadtest-{runId}-market-*)."
        className="border-destructive/30"
      >
        <div className="space-y-3">
          <Label>Type RUN LOAD TEST to confirm</Label>
          <Input value={confirmCleanup} onChange={(e) => setConfirmCleanup(e.target.value)} />
          <Button
            variant="destructive"
            disabled={confirmCleanup !== "RUN LOAD TEST" || cleanupM.isPending}
            onClick={() => cleanupM.mutate()}
          >
            <Trash2 className="mr-2 size-4" />
            Cleanup run
          </Button>
        </div>
      </Panel>
    </div>
  );
}
