import brokenImage from "@/assets/broken-image.jpg";
import { DeleteMarketDialog } from "@/components/admin/markets/DeleteMarketDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { marketsApi } from "@/lib/admin/api";
import { getMarketAggregateStatus } from "@/lib/market";
import { Market } from "@/types/market";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ImageIcon, Search, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";

export function MarketsHistorySection() {
  const [search, setSearch] = useState("");
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Market | null>(null);

  const { data: markets } = useQuery({
    queryKey: ["markets", "history", search],
    queryFn: async () => {
      const result = await marketsApi.list({
        view: "history",
        ...(search ? { search } : {}),
        limit: 200,
      });
      return result.items;
    },
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search history…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Picture</TableHead>
              <TableHead>Title (EN)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Record</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets && markets.length > 0 ? (
              markets.map((market) => (
                <Fragment key={market.id}>
                  <TableRow>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedMarketId((prev) => (prev === market.id ? null : market.id))
                      }
                    >
                      {expandedMarketId === market.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 overflow-hidden rounded">
                        {market.picture_url ? (
                          <img
                            src={market.picture_url}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = brokenImage;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{market.title_en}</TableCell>
                    <TableCell>{market.category?.title_en ?? "—"}</TableCell>
                    <TableCell>{market.market_items?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {getMarketAggregateStatus(market)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {market.deleted_at ? (
                        <Badge variant="outline" className="text-red-400 border-red-400/40">
                          Deleted
                        </Badge>
                      ) : (
                        <Badge variant="outline">Resolved</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!market.deleted_at && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${market.title_en}`}
                          onClick={() => setDeleteTarget(market)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedMarketId === market.id && (
                    <TableRow className="bg-accent/30">
                      <TableCell colSpan={8} className="p-4">
                        <div className="space-y-2 text-sm">
                          <p className="text-muted-foreground">{market.description_en}</p>
                          <ul className="space-y-1">
                            {(market.market_items ?? []).map((item) => (
                              <li key={item.id} className="flex flex-wrap gap-2">
                                <span className="font-medium">{item.title_en}</span>
                                <Badge variant="secondary" className="capitalize">
                                  {item.status}
                                </Badge>
                                {item.outcome && (
                                  <Badge variant="outline" className="capitalize">
                                    {item.outcome}
                                  </Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No market history yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <DeleteMarketDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          initial={deleteTarget}
        />
      )}
    </div>
  );
}
