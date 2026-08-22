import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { modulesApi } from "@/lib/admin/api";
import { Spinner, ErrorState, EmptyState, StatusPill, TableShell } from "./parts";

// Module Access is read-only: modules are defined by the platform (seeded) and
// surfaced here for reference. Granting them to roles happens on Roles & Permissions.
export function ModulesScreen() {
  const [search, setSearch] = useState("");

  const modulesQ = useQuery({
    queryKey: ["admin", "modules", search],
    queryFn: () => modulesApi.list(search),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {modulesQ.isLoading ? (
        <Spinner />
      ) : modulesQ.isError ? (
        <ErrorState
          message={(modulesQ.error as Error).message}
          onRetry={() => modulesQ.refetch()}
        />
      ) : (modulesQ.data?.length ?? 0) === 0 ? (
        <EmptyState message="No modules defined. Modules are the access-controlled capabilities you grant to roles." />
      ) : (
        <TableShell head={["Code", "Name", "Description", "Status"]}>
          {modulesQ.data!.map((m) => (
            <tr
              key={m.id}
              className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{m.code}</code>
              </td>
              <td className="px-4 py-3 font-medium">{m.name}</td>
              <td className="max-w-[320px] truncate px-4 py-3 text-xs text-muted-foreground">
                {m.description || "—"}
              </td>
              <td className="px-4 py-3">
                <StatusPill enabled={m.is_enable} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
