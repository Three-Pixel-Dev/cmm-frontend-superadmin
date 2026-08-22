import { createFileRoute } from "@tanstack/react-router";
import { TelegramSettingsTab } from "@/components/admin/TelegramSettingsTab";

export const Route = createFileRoute("/_admin/settings/telegram")({
  head: () => ({ meta: [{ title: "Telegram — Settings — SuperCash Admin" }] }),
  component: TelegramSettingsPage,
});

function TelegramSettingsPage() {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Telegram bots</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Configure market channel messages, manual broadcasts, and P2P low-balance alerts.
        </p>
      </div>
      <TelegramSettingsTab />
    </section>
  );
}
