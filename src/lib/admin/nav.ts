import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Home,
  KeyRound,
  MessageCircle,
  QrCode,
  Settings,
  UserCog,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";

export type SettingsSectionKey =
  | "profile"
  | "security"
  | "payment-types"
  | "payment"
  | "crypto-wallet"
  | "telegram";

export type AdminSection =
  | "home"
  | "dashboard"
  | "users"
  | "roles"
  | "modules"
  | "access-codes"
  | "markets"
  | "market-categories"
  | "market-history"
  | "banners"
  | "wallets"
  | "p2p"
  | "load-test"
  | "settings-profile"
  | "settings-security"
  | "settings-payment-types"
  | "settings-payment"
  | "settings-crypto-wallet"
  | "settings-telegram";

export type RbacSection = Exclude<
  AdminSection,
  | "home"
  | "settings-profile"
  | "settings-security"
  | "settings-payment-types"
  | "settings-payment"
  | "settings-crypto-wallet"
  | "settings-telegram"
>;

const PERSONAL_SETTINGS_SECTIONS: AdminSection[] = [
  "settings-profile",
  "settings-security",
  "settings-payment",
];

function settingsSectionAllowed(section: AdminSection, allow: Set<string>): boolean {
  if (PERSONAL_SETTINGS_SECTIONS.includes(section)) return true;
  if (allow.has("*")) return true;
  switch (section) {
    case "settings-payment-types":
    case "settings-crypto-wallet":
      return allow.has("wallets");
    case "settings-telegram":
      return allow.has("telegram") || allow.has("p2p");
    default:
      return false;
  }
}

function filterSettingsSidebar(allow?: Set<string>): SidebarGroup {
  const children = SETTINGS_SIDEBAR.children.filter((child) => {
    if (!allow) return PERSONAL_SETTINGS_SECTIONS.includes(child.key);
    if (allow.has("*")) return true;
    return settingsSectionAllowed(child.key, allow);
  });
  return { ...SETTINGS_SIDEBAR, children };
}

export const SECTION_PATHS: Record<AdminSection, string> = {
  home: "/",
  dashboard: "/dashboard",
  users: "/users",
  roles: "/roles",
  modules: "/modules",
  "access-codes": "/access-codes",
  markets: "/markets",
  "market-categories": "/market-categories",
  "market-history": "/market-history",
  banners: "/banners",
  wallets: "/wallets",
  p2p: "/p2p",
  "load-test": "/load-test",
  "settings-profile": "/settings/profile",
  "settings-security": "/settings/security",
  "settings-payment-types": "/settings/payment-types",
  "settings-payment": "/settings/payment",
  "settings-crypto-wallet": "/settings/crypto-wallet",
  "settings-telegram": "/settings/telegram",
};

export const SECTION_TITLES: Record<AdminSection, string> = {
  home: "Home",
  dashboard: "Dashboard",
  users: "All Users",
  roles: "Roles & Permissions",
  modules: "Module Access",
  "access-codes": "Access Codes",
  markets: "Market Management",
  "market-categories": "Market Categories",
  "market-history": "Market History",
  banners: "Promotional Banners",
  wallets: "Wallets",
  p2p: "P2P Agents",
  "load-test": "Load Test",
  "settings-profile": "Profile",
  "settings-security": "Security",
  "settings-payment-types": "Payment Types",
  "settings-payment": "Payment methods",
  "settings-crypto-wallet": "Crypto wallet",
  "settings-telegram": "Telegram",
};

export type NavLeaf = {
  key: RbacSection;
  label: string;
  Icon: LucideIcon;
  description: string;
  to: string;
};

export type NavGroup = {
  id: string;
  label: string;
  Icon: LucideIcon;
  children: NavLeaf[];
};

export type NavEntry = NavLeaf | NavGroup;

export type SidebarLeaf = {
  type: "leaf";
  key: AdminSection;
  label: string;
  Icon: LucideIcon;
  to: string;
};

export type SidebarGroup = {
  type: "group";
  id: string;
  label: string;
  Icon: LucideIcon;
  children: SidebarLeaf[];
};

export type SidebarEntry = SidebarLeaf | SidebarGroup;

export function isSidebarGroup(entry: SidebarEntry): entry is SidebarGroup {
  return entry.type === "group";
}

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const HOME_SIDEBAR: SidebarLeaf = {
  type: "leaf",
  key: "home",
  label: "Home",
  Icon: Home,
  to: SECTION_PATHS.home,
};

const SETTINGS_SIDEBAR: SidebarGroup = {
  type: "group",
  id: "settings-group",
  label: "Settings",
  Icon: Settings,
  children: [
    {
      type: "leaf",
      key: "settings-profile",
      label: "Profile",
      Icon: UserCog,
      to: SECTION_PATHS["settings-profile"],
    },
    {
      type: "leaf",
      key: "settings-security",
      label: "Security",
      Icon: KeyRound,
      to: SECTION_PATHS["settings-security"],
    },
    {
      type: "leaf",
      key: "settings-payment-types",
      label: "Payment types",
      Icon: WalletCards,
      to: SECTION_PATHS["settings-payment-types"],
    },
    {
      type: "leaf",
      key: "settings-payment",
      label: "Payment methods",
      Icon: CreditCard,
      to: SECTION_PATHS["settings-payment"],
    },
    {
      type: "leaf",
      key: "settings-crypto-wallet",
      label: "Crypto wallet",
      Icon: QrCode,
      to: SECTION_PATHS["settings-crypto-wallet"],
    },
    {
      type: "leaf",
      key: "settings-telegram",
      label: "Telegram",
      Icon: MessageCircle,
      to: SECTION_PATHS["settings-telegram"],
    },
  ],
};

export const RBAC_NAV: NavEntry[] = [
  {
    key: "access-codes",
    label: "Access Codes",
    Icon: KeyRound,
    description: "Issue and revoke host access codes",
    to: SECTION_PATHS["access-codes"],
  },
  {
    key: "wallets",
    label: "Wallets",
    Icon: Wallet,
    description: "View and adjust user wallet balances",
    to: SECTION_PATHS.wallets,
  },
  {
    key: "users",
    label: "All Users",
    Icon: Users,
    description: "Create, edit and disable user accounts",
    to: SECTION_PATHS.users,
  },
];

function filterRbacNav(entries: NavEntry[], allow: Set<string>): NavEntry[] {
  const out: NavEntry[] = [];
  for (const entry of entries) {
    if (!isNavGroup(entry)) {
      if (isNavLeafAllowed(entry.key, allow)) out.push(entry);
    } else {
      const children = entry.children.filter((c) => isNavLeafAllowed(c.key, allow));
      if (children.length) out.push({ ...entry, children });
    }
  }
  return out;
}

function isNavLeafAllowed(key: RbacSection, allow: Set<string>): boolean {
  if (allow.has("*") && key === "access-codes") return true;
  if (allow.has(key)) return true;
  if (key === "market-categories" && allow.has("markets")) return true;
  if (key === "market-history" && allow.has("markets")) return true;
  if (key === "banners" && allow.has("markets")) return true;
  return false;
}

function toSidebarEntries(entries: NavEntry[]): SidebarEntry[] {
  return entries.map((entry) => {
    if (!isNavGroup(entry)) {
      return {
        type: "leaf",
        key: entry.key,
        label: entry.label,
        Icon: entry.Icon,
        to: entry.to,
      };
    }
    return {
      type: "group",
      id: entry.id,
      label: entry.label,
      Icon: entry.Icon,
      children: entry.children.map((child) => ({
        type: "leaf" as const,
        key: child.key,
        label: child.label,
        Icon: child.Icon,
        to: child.to,
      })),
    };
  });
}

export function buildSidebarNav(allowed?: string[]): SidebarEntry[] {
  const allowSet = allowed ? new Set(allowed) : undefined;
  const settings: SidebarEntry[] = [filterSettingsSidebar(allowSet)];
  if (allowed?.includes("*")) {
    return [HOME_SIDEBAR, ...toSidebarEntries(RBAC_NAV), ...settings];
  }
  if (allowed === undefined || allowed.length === 0) {
    return [HOME_SIDEBAR, ...settings];
  }
  const allow = new Set(allowed);
  return [HOME_SIDEBAR, ...toSidebarEntries(filterRbacNav(RBAC_NAV, allow)), ...settings];
}

export function groupContains(group: SidebarGroup, active: AdminSection) {
  return group.children.some((c) => c.key === active);
}

export function isSettingsSection(section: AdminSection): boolean {
  return (
    section === "settings-profile" ||
    section === "settings-security" ||
    section === "settings-payment-types" ||
    section === "settings-payment" ||
    section === "settings-crypto-wallet" ||
    section === "settings-telegram"
  );
}

export function isSectionAllowed(
  section: AdminSection,
  allowed?: string[],
  roleName?: string,
): boolean {
  if (section === "load-test") {
    return (
      import.meta.env.VITE_ENABLE_LOAD_TEST === "true" && roleName?.toLowerCase() === "super_admin"
    );
  }
  if (section === "home") return true;
  if (section === "access-codes") return allowed?.includes("*") === true;
  if (PERSONAL_SETTINGS_SECTIONS.includes(section)) return true;
  if (isSettingsSection(section)) {
    if (allowed === undefined) return false;
    if (allowed.includes("*")) return true;
    return settingsSectionAllowed(section, new Set(allowed));
  }
  if (allowed === undefined) return false;
  if (allowed.includes("*")) return true;
  if (section === "market-categories") return allowed.includes("markets");
  if (section === "market-history") return allowed.includes("markets");
  if (section === "banners") return allowed.includes("markets");
  return allowed.includes(section);
}

export function pathToSection(pathname: string): AdminSection {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/settings/payment-types") return "settings-payment-types";
  if (path === "/settings/payment") return "settings-payment";
  if (path === "/settings/crypto-wallet") return "settings-crypto-wallet";
  if (path === "/settings/telegram") return "settings-telegram";
  if (path === "/settings/security") return "settings-security";
  if (path.startsWith("/settings")) return "settings-profile";
  if (path === "/dashboard") return "dashboard";
  if (path === "/users") return "users";
  if (path === "/access-codes") return "access-codes";
  if (path === "/roles") return "roles";
  if (path === "/modules") return "modules";
  if (path === "/markets" || /^\/markets\/[^/]+\/edit$/.test(path)) return "markets";
  if (path === "/market-categories") return "market-categories";
  if (path === "/market-history") return "market-history";
  if (path === "/banners") return "banners";
  if (path === "/wallets") return "wallets";
  if (path === "/p2p" || path.startsWith("/p2p/")) return "p2p";
  if (path === "/load-test") return "load-test";
  return "home";
}

export function pageTitleFromPath(pathname: string): string {
  const section = pathToSection(pathname);
  if (isSettingsSection(section)) return "Settings";
  return SECTION_TITLES[section];
}

export type QuickLink = {
  key: RbacSection;
  label: string;
  description: string;
  Icon: LucideIcon;
  to: string;
};

function flattenLeaves(entries: NavEntry[]): QuickLink[] {
  const out: QuickLink[] = [];
  for (const entry of entries) {
    if (!isNavGroup(entry)) {
      out.push({
        key: entry.key,
        label: entry.label,
        description: entry.description,
        Icon: entry.Icon,
        to: entry.to,
      });
    } else {
      for (const child of entry.children) {
        out.push({
          key: child.key,
          label: child.label,
          description: child.description,
          Icon: child.Icon,
          to: child.to,
        });
      }
    }
  }
  return out;
}

export function getQuickLinks(allowed?: string[]): QuickLink[] {
  if (allowed?.includes("*")) {
    return flattenLeaves(RBAC_NAV);
  }
  if (!allowed || allowed.length === 0) {
    return [];
  }
  return flattenLeaves(filterRbacNav(RBAC_NAV, new Set(allowed)));
}

export function formatRoleName(roleName?: string): string {
  if (!roleName) return "Staff";
  return roleName
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
