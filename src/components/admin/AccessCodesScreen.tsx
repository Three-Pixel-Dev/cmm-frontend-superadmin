import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2, Plus, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { accessCodesApi, type AccessCode } from "@/lib/admin/api";

export function AccessCodesScreen() {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [hostName, setHostName] = useState("");
  const [freshCode, setFreshCode] = useState<AccessCode | null>(null);

  const listQ = useQuery({
    queryKey: ["admin", "access-codes"],
    queryFn: () => accessCodesApi.list(),
  });

  const createM = useMutation({
    mutationFn: () =>
      accessCodesApi.create({
        label: label.trim(),
        host_name: hostName.trim() || undefined,
      }),
    onSuccess: (row) => {
      setFreshCode(row);
      setLabel("");
      setHostName("");
      toast.success("Access code created");
      void qc.invalidateQueries({ queryKey: ["admin", "access-codes"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeM = useMutation({
    mutationFn: (id: string) => accessCodesApi.revoke(id),
    onSuccess: () => {
      toast.success("Code revoked");
      void qc.invalidateQueries({ queryKey: ["admin", "access-codes"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Host access codes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Issue a code, send it to a host, and they sign in on the game app. First use creates
              their room-admin account. Codes stay visible here so you can resend them if a host
              forgets.
            </p>
          </div>
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (label.trim().length < 2) {
              toast.error("Label must be at least 2 characters");
              return;
            }
            createM.mutate();
          }}
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Yangon host)"
          />
          <Input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Host name (optional)"
          />
          <Button type="submit" disabled={createM.isPending}>
            {createM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate
          </Button>
        </form>

        {freshCode?.code ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                New access code
              </p>
              <p className="mt-1 font-mono text-2xl tracking-[0.28em]">{freshCode.code}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => void copy(freshCode.code!)}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Host</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last used</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No codes yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3">
                    {row.code ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tracking-wider">{row.code}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-muted-foreground"
                          onClick={() => void copy(row.code!)}
                          aria-label={`Copy code for ${row.label}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not stored</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.host_name || "—"}</td>
                  <td className="px-4 py-3">
                    {row.is_active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Revoked</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.last_used_at ? new Date(row.last_used_at).toLocaleString() : "Unused"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.is_active ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={revokeM.isPending}
                        onClick={() => revokeM.mutate(row.id)}
                      >
                        <ShieldOff className="h-4 w-4" />
                        Revoke
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
