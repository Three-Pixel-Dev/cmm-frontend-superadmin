import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRoleName, getQuickLinks, SECTION_PATHS, type QuickLink } from "@/lib/admin/nav";

type HomeSectionProps = {
  name?: string;
  email?: string;
  roleName?: string;
  allowedCodes?: string[];
};

export function HomeSection({ name, email, roleName, allowedCodes }: HomeSectionProps) {
  const quickLinks = getQuickLinks(allowedCodes);
  const displayName = name?.trim() || email?.split("@")[0] || "there";
  const formattedRole = formatRoleName(roleName);

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="home-welcome-heading"
        className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8"
      >
        <p className="text-sm font-medium text-primary">Host access and emergency tools</p>
        <h2
          id="home-welcome-heading"
          className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Welcome back, {displayName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {quickLinks.length > 0
            ? "Issue host access codes, revoke them, and adjust wallets when a table needs it."
            : "Your account is signed in, but no admin modules are assigned yet. Contact a platform administrator if you need access."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {email && (
            <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              {email}
            </span>
          )}
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {formattedRole}
          </span>
        </div>
      </section>

      {quickLinks.length > 0 ? (
        <section aria-labelledby="home-quick-links-heading">
          <h3 id="home-quick-links-heading" className="text-sm font-semibold">
            Quick access
          </h3>
          <nav aria-label="Quick access" className="mt-3">
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <QuickLinkCard link={link} />
                </li>
              ))}
            </ul>
          </nav>
        </section>
      ) : (
        <section
          aria-labelledby="home-empty-heading"
          className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center"
        >
          <h3 id="home-empty-heading" className="text-sm font-semibold">
            No modules assigned
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You can still update your password in Settings.
          </p>
          <Button asChild variant="outline" className="mt-4 gap-2">
            <Link to={SECTION_PATHS["settings-security"]} aria-label="Open account settings">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Open Settings
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}

function QuickLinkCard({ link }: { link: QuickLink }) {
  const Icon = link.Icon;

  return (
    <Link
      to={link.to}
      aria-label={`Go to ${link.label}`}
      className={cn(
        "group flex h-full w-full flex-col rounded-xl border border-border/60 bg-card p-4 text-left transition-colors",
        "hover:border-primary/40 hover:bg-accent/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-safe:transition-transform motion-safe:hover:-translate-y-0.5",
      )}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-3 text-sm font-semibold">{link.label}</span>
      <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{link.description}</span>
    </Link>
  );
}
