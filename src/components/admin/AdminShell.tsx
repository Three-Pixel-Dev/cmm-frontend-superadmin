import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CUSTOMER_APP_URL } from "@/lib/app-url";
import {
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import {
  buildSidebarNav,
  groupContains,
  isSidebarGroup,
  isSettingsSection,
  pageTitleFromPath,
  type AdminSection,
  type SidebarEntry,
} from "@/lib/admin/nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";

export type { AdminSection } from "@/lib/admin/nav";

function isNavActive(pathname: string, to: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  const target = to.replace(/\/$/, "") || "/";
  return path === target || path.startsWith(`${target}/`);
}

export function AdminShell({
  active,
  allowedCodes,
  userEmail,
  onLogout,
  children,
}: {
  active: AdminSection;
  allowedCodes?: string[];
  userEmail?: string;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = buildSidebarNav(allowedCodes);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of nav) {
      if (isSidebarGroup(e)) {
        init[e.id] = groupContains(e, active) || isSettingsSection(active);
      }
    }
    return init;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Admin"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border/60 bg-card flex flex-col",
          "transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4 shrink-0">
          <BrandLogo variant="icon" className="h-8 w-8" />
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold tracking-tight">SuperCash Admin</p>
            <p className="text-[10px] text-muted-foreground">Control Panel</p>
          </div>
        </div>

        <nav aria-label="Sections" className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          {nav.map((entry) => (
            <SidebarEntry
              key={isSidebarGroup(entry) ? entry.id : entry.key}
              entry={entry}
              active={active}
              pathname={pathname}
              openGroups={openGroups}
              setOpenGroups={setOpenGroups}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        <div className="border-t border-border/60 p-3 shrink-0">
          <a
            href={CUSTOMER_APP_URL}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to SuperCash
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-base font-semibold">{pageTitleFromPath(pathname)}</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                {userEmail && (
                  <span className="hidden max-w-[160px] truncate sm:block">{userEmail}</span>
                )}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                {userEmail && (
                  <>
                    <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                      {userEmail}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings/profile" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                {onLogout && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="danger" onSelect={onLogout}>
                      <LogOut className="h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="admin-content" className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarEntry({
  entry,
  active,
  pathname,
  openGroups,
  setOpenGroups,
  onNavigate,
}: {
  entry: SidebarEntry;
  active: AdminSection;
  pathname: string;
  openGroups: Record<string, boolean>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onNavigate: () => void;
}) {
  if (!isSidebarGroup(entry)) {
    const Icon = entry.Icon;
    return (
      <NavLink
        to={entry.to}
        icon={<Icon className="h-4 w-4" aria-hidden="true" />}
        label={entry.label}
        active={isNavActive(pathname, entry.to)}
        onClick={onNavigate}
      />
    );
  }

  const GroupIcon = entry.Icon;
  const open = openGroups[entry.id] ?? false;
  const hasActive = groupContains(entry, active);
  const panelId = `nav-panel-${entry.id}`;

  return (
    <div>
      <button
        onClick={() => setOpenGroups((g) => ({ ...g, [entry.id]: !g[entry.id] }))}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hasActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        )}
      >
        <span className="shrink-0">
          <GroupIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="flex-1 text-left">{entry.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        className={cn("overflow-hidden transition-all", open ? "max-h-60" : "max-h-0")}
      >
        <div className="ml-3 mt-1 space-y-1 border-l border-border/60 pl-3">
          {entry.children.map((child) => {
            const ChildIcon = child.Icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                icon={<ChildIcon className="h-4 w-4" aria-hidden="true" />}
                label={child.label}
                active={isNavActive(pathname, child.to)}
                onClick={onNavigate}
                small
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavLink({
  to,
  icon,
  label,
  active,
  onClick,
  badge,
  small,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  badge?: number;
  small?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        small ? "py-1.5" : "py-2",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
