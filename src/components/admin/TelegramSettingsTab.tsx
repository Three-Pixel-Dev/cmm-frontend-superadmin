import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authApi, telegramApi } from "@/lib/admin/api";
import { ErrorState, Field, Spinner } from "@/components/admin/parts";
import { useAuth } from "@/store/useAuth";

const TEMPLATE_VARS = [
  "{{title_en}}",
  "{{title_my}}",
  "{{title_my_suffix}}",
  "{{description}}",
  "{{outcome_count}}",
  "{{markets_url}}",
  "{{photo_note}}",
] as const;

export function TelegramSettingsTab() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const permsQ = useQuery({
    queryKey: ["admin", "me", "permissions", user?.id],
    queryFn: () => authApi.myPermissions(),
    enabled: !!user?.id,
    staleTime: 0,
  });
  const allowed = permsQ.data?.codes;
  const hasTelegram = useMemo(
    () => allowed?.includes("*") || allowed?.includes("telegram") || false,
    [allowed],
  );
  const hasP2p = useMemo(
    () => allowed?.includes("*") || allowed?.includes("p2p") || false,
    [allowed],
  );

  const settingsQ = useQuery({
    queryKey: ["admin", "telegram", "settings"],
    queryFn: () => telegramApi.getSettings(),
  });

  const [marketEnabled, setMarketEnabled] = useState(true);
  const [threshold, setThreshold] = useState("0");
  const [marketTemplate, setMarketTemplate] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || !settingsQ.data) return;
    setMarketEnabled(settingsQ.data.market_bot_enabled);
    setThreshold(settingsQ.data.p2p_low_balance_threshold);
    setMarketTemplate(settingsQ.data.market_message_template ?? "");
    setHydrated(true);
  }, [settingsQ.data, hydrated]);

  const saveM = useMutation({
    mutationFn: () => {
      const body: Parameters<typeof telegramApi.updateSettings>[0] = {};
      if (hasTelegram) {
        body.market_bot_enabled = marketEnabled;
        body.market_message_template = marketTemplate;
      }
      if (hasP2p) {
        body.p2p_low_balance_threshold = threshold.trim();
      }
      return telegramApi.updateSettings(body);
    },
    onSuccess: () => {
      toast.success("Telegram settings saved");
      void qc.invalidateQueries({ queryKey: ["admin", "telegram", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendM = useMutation({
    mutationFn: () => telegramApi.sendChannelMessage(manualMessage.trim()),
    onSuccess: () => {
      toast.success("Message sent to Telegram channel");
      setManualMessage("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to send message"),
  });

  if (settingsQ.isLoading || permsQ.isLoading) return <Spinner />;
  if (settingsQ.isError) {
    return <ErrorState message={(settingsQ.error as Error).message} onRetry={() => settingsQ.refetch()} />;
  }
  if (!hasTelegram && !hasP2p) {
    return (
      <ErrorState message="You do not have access to Telegram or P2P settings." />
    );
  }

  const defaultTemplate = settingsQ.data?.default_market_message_template ?? "";

  return (
    <div className="space-y-8">
      {(hasTelegram || hasP2p) && (
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveM.mutate();
        }}
      >
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          Bot tokens and the market Telegram channel ID are configured in server environment variables (
          <code className="text-xs">TELEGRAM_P2P_BOT_TOKEN</code>,{" "}
          <code className="text-xs">TELEGRAM_MARKET_BOT_TOKEN</code>,{" "}
          <code className="text-xs">TELEGRAM_MARKET_CHANNEL_ID</code>).
        </div>

        {hasTelegram && (
        <>
        <Field label="Market bot">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={marketEnabled}
              onChange={(e) => setMarketEnabled(e.target.checked)}
            />
            Post to Telegram when a market is published
          </label>
        </Field>

        <Field label="Market publish message template">
          <p className="mb-2 text-xs text-muted-foreground">
            Customize the HTML message sent when a market is published. Leave empty to use the default
            template. Supports Telegram HTML tags such as <code>&lt;b&gt;</code>, <code>&lt;a href&gt;</code>.
          </p>
          <p className="mb-2 text-xs text-muted-foreground">
            Variables: {TEMPLATE_VARS.join(", ")}
          </p>
          <Textarea
            value={marketTemplate}
            onChange={(e) => setMarketTemplate(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={defaultTemplate}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMarketTemplate(defaultTemplate)}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Use default template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMarketTemplate("")}
            >
              Clear (built-in default)
            </Button>
          </div>
        </Field>
        </>
        )}

        {hasP2p && (
        <Field label="P2P low balance threshold (MMK)">
          <p className="mb-2 text-xs text-muted-foreground">
            Linked P2P agents receive a Telegram alert when their wallet drops below this amount.
          </p>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="50000"
          />
        </Field>
        )}

        <Button type="submit" disabled={saveM.isPending}>
          {saveM.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save changes
            </>
          )}
        </Button>
      </form>
      )}

      {hasTelegram && (
      <section className="space-y-3 border-t border-border/60 pt-6">
        <div>
          <h3 className="text-sm font-semibold">Manual channel message</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Send a one-off announcement to the market Telegram channel. HTML formatting is supported.
          </p>
        </div>
        <Textarea
          value={manualMessage}
          onChange={(e) => setManualMessage(e.target.value)}
          rows={5}
          placeholder="📢 Platform maintenance tonight at 10 PM…"
        />
        <Button
          type="button"
          disabled={sendM.isPending || !manualMessage.trim()}
          onClick={() => sendM.mutate()}
        >
          {sendM.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send to channel
            </>
          )}
        </Button>
      </section>
      )}
    </div>
  );
}
