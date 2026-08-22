import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fmtDate, fmtVks } from "@/lib/format";
import { adminChatApi, p2pApi, transactionsApi } from "@/lib/admin/api";
import type { ChatConversation, ChatMessage, ChatMessageEvent } from "@/lib/admin/types";
import { P2PApplicationInfoView } from "@/components/admin/P2PApplicationInfoView";
import { useAuth } from "@/store/useAuth";
import { useWebsocketSubscription } from "@/components/WebsocketProvider";
import { Spinner, ErrorState, EmptyState, StatusPill, TableShell } from "./parts";

function fmtNum(value: string, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const messagesKey = (id: string) => ["admin", "chat", "messages", id] as const;

export function P2PAgentDetail({ p2pId }: { p2pId: string }) {
  const agentQ = useQuery({
    queryKey: ["admin", "p2p", "detail", p2pId],
    queryFn: () => p2pApi.getById(p2pId),
  });

  return (
    <div className="space-y-6">
      <Link
        to="/p2p"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" /> Back to P2P agents
      </Link>

      {agentQ.isLoading ? (
        <Spinner />
      ) : agentQ.isError ? (
        <ErrorState message={(agentQ.error as Error).message} onRetry={() => agentQ.refetch()} />
      ) : agentQ.data ? (
        <>
          <header className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
              {initials(agentQ.data.user_name)}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{agentQ.data.user_name || "P2P Agent"}</h2>
              {agentQ.data.user_email && (
                <p className="text-sm text-muted-foreground">{agentQ.data.user_email}</p>
              )}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-5 text-sm">
              <Metric label="Range" value={`${fmtNum(agentQ.data.from_range)}–${fmtNum(agentQ.data.to_range)}`} />
              <Metric label="Commission" value={`${fmtNum(agentQ.data.commission_rate, 4)}%`} />
              <Metric label="Complete %" value={`${fmtNum(agentQ.data.complete_percentage)}%`} />
              <Metric label="Trades" value={String(agentQ.data.trade_count)} />
              <StatusPill enabled={agentQ.data.is_enable} />
            </div>
          </header>

          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="chats">Conversations</TabsTrigger>
              <TabsTrigger value="application">Application</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
              <TransactionsPanel userId={agentQ.data.user_id} />
            </TabsContent>
            <TabsContent value="chats">
              <ConversationsPanel p2pId={p2pId} />
            </TabsContent>
            <TabsContent value="application">
              <ApplicationPanel userId={agentQ.data.user_id} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState message="Agent not found." />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ApplicationPanel({ userId }: { userId: string }) {
  const appQ = useQuery({
    queryKey: ["admin", "p2p-application", "by-user", userId],
    queryFn: () => p2pApi.getApplicationByUser(userId),
    retry: false,
  });

  if (appQ.isLoading) return <Spinner />;
  if (appQ.isError) {
    const message = (appQ.error as Error).message;
    if (message.toLowerCase().includes("not found")) {
      return (
        <EmptyState message="No P2P agent application on file for this user." />
      );
    }
    return <ErrorState message={message} onRetry={() => appQ.refetch()} />;
  }
  if (!appQ.data) {
    return <EmptyState message="No P2P agent application on file for this user." />;
  }

  return (
    <P2PApplicationInfoView
      app={appQ.data}
      editablePaymentMethods={appQ.data.status === "approved" || appQ.data.status === "pending"}
    />
  );
}

function TransactionsPanel({ userId }: { userId: string }) {
  const txQ = useQuery({
    queryKey: ["admin", "transactions", userId],
    queryFn: () => transactionsApi.listByUser(userId, { limit: 100 }),
  });

  if (txQ.isLoading) return <Spinner />;
  if (txQ.isError)
    return <ErrorState message={(txQ.error as Error).message} onRetry={() => txQ.refetch()} />;
  const items = txQ.data?.items ?? [];
  if (items.length === 0) return <EmptyState message="No transactions for this agent yet." />;

  return (
    <TableShell head={["Type", "Direction", "Amount", "Source", "Status", "Date"]}>
      {items.map((t) => (
        <tr key={t.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
          <td className="px-4 py-3 capitalize">{t.type ?? "—"}</td>
          <td className="px-4 py-3 capitalize text-muted-foreground">{t.tran_type ?? "—"}</td>
          <td className="px-4 py-3 tabular-nums">{fmtVks(Number(t.amount))}</td>
          <td className="px-4 py-3 uppercase text-muted-foreground">{t.source_type ?? "—"}</td>
          <td className="px-4 py-3 capitalize">{t.status ?? "—"}</td>
          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
            {fmtDate(t.created_at)}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

function ConversationsPanel({ p2pId }: { p2pId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const joinM = useMutation({ mutationFn: (id: string) => adminChatApi.join(id) });

  const convsQ = useQuery({
    queryKey: ["admin", "chat", "conversations", p2pId],
    queryFn: () => adminChatApi.listConversations({ p2p_id: p2pId, limit: 100 }),
  });
  const conversations = convsQ.data?.items ?? [];
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    joinM.mutate(id, {
      onError: (e: Error) => toast.error(`Couldn't join conversation: ${e.message}`),
    });
  };

  return (
    <div className="flex h-[calc(100vh-20rem)] min-h-[420px] overflow-hidden rounded-xl border border-border/60 bg-card">
      <aside className="w-72 shrink-0 border-r border-border/60">
        <div className="border-b border-border/60 px-4 py-3">
          <h3 className="text-sm font-semibold">Conversations</h3>
        </div>
        {convsQ.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState message="No conversations for this agent." />
        ) : (
          <ul className="h-[calc(100%-3rem)] overflow-y-auto">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  aria-current={c.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    c.id === selectedId && "bg-primary/10",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {initials(c.customer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {c.customer.name || "Customer"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {c.last_message_text ?? "No messages yet"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a conversation to view and mediate
          </div>
        ) : (
          <AdminThread conversation={selected} joining={joinM.isPending} />
        )}
      </section>
    </div>
  );
}

function AdminThread({
  conversation,
  joining,
}: {
  conversation: ChatConversation;
  joining: boolean;
}) {
  const qc = useQueryClient();
  const myId = useAuth((s) => s.user?.id);
  const { subscribe } = useWebsocketSubscription();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQ = useQuery({
    queryKey: messagesKey(conversation.id),
    queryFn: () => adminChatApi.listMessages(conversation.id, { limit: 100 }),
  });
  const messages = useMemo(() => messagesQ.data ?? [], [messagesQ.data]);

  const sendM = useMutation({
    mutationFn: (body: string) => adminChatApi.sendMessage(conversation.id, body),
    onSuccess: (msg) => upsert(qc, conversation.id, msg),
    onError: (e: Error) => toast.error(e.message),
  });

  // Admin receives published messages on their own channel after joining.
  useEffect(() => {
    if (!myId) return;
    return subscribe(`user.${myId}.chat`, (payload) => {
      let data: unknown = payload;
      if (typeof payload === "string") {
        try {
          data = JSON.parse(payload);
        } catch {
          return;
        }
      }
      const ev = data as ChatMessageEvent | undefined;
      if (!ev || ev.eventType !== "chat.message" || !ev.message) return;
      if (ev.conversation_id !== conversation.id) return;
      upsert(qc, conversation.id, ev.message);
    });
  }, [myId, subscribe, qc, conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sendM.isPending) return;
    setDraft("");
    sendM.mutate(body, { onError: () => setDraft(body) });
  };

  return (
    <>
      <div className="border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold">
          {conversation.customer.name || "Customer"}{" "}
          <span className="text-muted-foreground">↔</span>{" "}
          {conversation.agent.name || "Agent"}
        </h3>
        <p className="text-xs text-amber-500">You are mediating as Support — both parties see your messages.</p>
      </div>
      <div
        className="flex-1 space-y-3 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {messagesQ.isLoading || joining ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((msg) => <Bubble key={msg.id} msg={msg} mine={msg.sender.id === myId} />)
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border/60 p-3">
        <label htmlFor="admin-chat-composer" className="sr-only">
          Message
        </label>
        <Input
          id="admin-chat-composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message both parties as Support…"
          autoComplete="off"
        />
        <Button type="submit" disabled={!draft.trim() || sendM.isPending} aria-label="Send message">
          {sendM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </>
  );
}

function upsert(
  qc: ReturnType<typeof useQueryClient>,
  conversationId: string,
  msg: ChatMessage,
) {
  qc.setQueryData<ChatMessage[]>(messagesKey(conversationId), (old) => {
    const list = old ?? [];
    if (list.some((m) => m.id === msg.id)) return list.map((m) => (m.id === msg.id ? msg : m));
    return [...list, msg];
  });
}

function Bubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const role = msg.sender_role;
  const tint =
    role === "admin"
      ? "bg-amber-500/15 text-foreground ring-1 ring-amber-500/40"
      : role === "p2p"
        ? "bg-blue-500/15 text-foreground ring-1 ring-blue-500/30"
        : "bg-muted text-foreground";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : tint)}>
        {!mine && (
          <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-70">
            {role === "admin" && <ShieldCheck className="h-3 w-3" />}
            {role === "p2p" ? "Agent" : role === "admin" ? "Support" : "Customer"}
            {msg.sender.name ? ` · ${msg.sender.name}` : ""}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
        <p className={cn("mt-1 text-[10px]", mine ? "opacity-70" : "text-muted-foreground")}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
