import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { NrcData } from "@/data/nrc";
import { clearAdminSession } from "@/lib/admin/session";
import type {
  AdjustWalletPayload,
  CreateWalletPayload,
  ApiModule,
  ApiP2P,
  ApiP2PApplication,
  ApiPaymentMethodType,
  ApiAgentPaymentMethod,
  ApiCryptoDeposit,
  ApproveCryptoDepositPayload,
  ApiPaymentMethod,
  ApproveWalletFundingPayload,
  ApiWalletFundingRequest,
  CreatePaymentMethodPayload,
  RejectWalletFundingPayload,
  UpdatePaymentMethodPayload,
  RejectCryptoDepositPayload,
  ApproveP2PApplicationPayload,
  ApiProfile,
  ApiRole,
  ApiTransaction,
  ApiUser,
  ApiWallet,
  AuthResult,
  ChatConversation,
  ChatMessage,
  ChangePasswordPayload,
  CreateModulePayload,
  CreatePaymentMethodTypePayload,
  CreateP2PPayload,
  RejectP2PApplicationPayload,
  UpdateApplicationPaymentMethodsPayload,
  CreateRolePayload,
  CreateUserPayload,
  Paged,
  PlatformCryptoWallet,
  ResetPasswordResult,
  SavePlatformCryptoWalletPayload,
  TelegramSettings,
  UpdateMePayload,
  UpdateModulePayload,
  UpdatePaymentMethodTypePayload,
  UpdateP2PPayload,
  UpdateProfilePayload,
  UpdateRolePayload,
  UpdateTelegramSettingsPayload,
  UpdateUserPayload,
  UserPermissions,
} from "./types";
import {
  ApiMarketCategory,
  BetHistory,
  CreateMarketCategoryPayload,
  Market,
  MarketAffiliateStats,
  MarketItem,
  PlatformStats,
  UpdateMarketCategoryPayload,
} from "@/types/market";
import { CreateMarketInput, ResolveMarketInput, UpdateMarketInput } from "@/schemas/market.schema";
import { CreateMarketItemInput, ResolveMarketItemInput, UpdateMarketItemInput } from "@/schemas/market-item.schema";
import { FileResponse } from "@/types/file";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _skipAuthRefresh?: boolean;
  }
}

// Empty string uses the Vite dev proxy (/api → gateway). Set VITE_API_BASE_URL for direct access.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const HTTP_TIMEOUT_MS = 30_000;

export const http = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api/v1` : "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: HTTP_TIMEOUT_MS,
});

let refreshPromise: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  await http.post<ApiEnvelope<unknown>>("/auth/refresh", {}, { _skipAuthRefresh: true });
}

// The Go services wrap payloads in { success, message, data, error }.
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Normalize errors and refresh the cookie session on 401.
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config;
    const data = error.response?.data;
    const message =
      data?.error ||
      data?.message ||
      (error.code === "ECONNABORTED"
        ? "Request timed out. Check that the gateway and backend services are running."
        : error.code === "ERR_NETWORK"
          ? `Cannot reach the API${API_BASE ? ` at ${API_BASE}` : ""}. Is the gateway running?`
          : error.message) ||
      "Request failed";

    if (!original || original._skipAuthRefresh || error.response?.status !== 401) {
      return Promise.reject(new Error(message));
    }

    const url = original.url ?? "";
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout")
    ) {
      clearAdminSession();
      return Promise.reject(new Error(message));
    }

    try {
      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return http(original);
    } catch {
      clearAdminSession();
      return Promise.reject(new Error(message));
    }
  },
);

function data<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    http
      .post<ApiEnvelope<AuthResult>>("/auth/login", { email, password }, { _skipAuthRefresh: true })
      .then((r) => data(r.data)),
  logout: () =>
    http
      .post<ApiEnvelope<unknown>>("/auth/logout", {}, { _skipAuthRefresh: true })
      .then(() => undefined),
  me: () => http.get<ApiEnvelope<ApiUser>>("/users/me").then((r) => data(r.data)),
  myPermissions: () =>
    http.get<ApiEnvelope<UserPermissions>>("/users/me/permissions").then((r) => data(r.data)),
};

export type AccessCode = {
  id: string;
  label: string;
  host_name: string;
  code?: string;
  admin_user_id?: string | null;
  is_active: boolean;
  revoked_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
};

export const accessCodesApi = {
  list: () => http.get<ApiEnvelope<AccessCode[]>>("/admin/access-codes").then((r) => data(r.data)),
  create: (body: { label: string; host_name?: string }) =>
    http.post<ApiEnvelope<AccessCode>>("/admin/access-codes", body).then((r) => data(r.data)),
  revoke: (id: string) =>
    http.post<ApiEnvelope<AccessCode>>(`/admin/access-codes/${id}/revoke`).then((r) => data(r.data)),
};

// ─── Users ──────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params: { page?: number; limit?: number; search?: string; role_id?: string } = {}) =>
    http.get<ApiEnvelope<Paged<ApiUser>>>("/users", { params }).then((r) => data(r.data)),
  create: (body: CreateUserPayload) =>
    http.post<ApiEnvelope<ApiUser>>("/users/", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateUserPayload) =>
    http.patch<ApiEnvelope<ApiUser>>(`/users/${id}`, body).then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/users/${id}`).then(() => null),
  permissions: (id: string) =>
    http.get<ApiEnvelope<UserPermissions>>(`/users/${id}/permissions`).then((r) => data(r.data)),
  // Admin-initiated reset: the backend generates a temporary password and
  // returns it exactly once.
  resetPassword: (id: string) =>
    http
      .post<ApiEnvelope<ResetPasswordResult>>(`/users/${id}/reset-password`)
      .then((r) => data(r.data)),
  // ─ Self-service ("me") ─
  me: () => http.get<ApiEnvelope<ApiUser>>("/users/me").then((r) => data(r.data)),
  updateMe: (body: UpdateMePayload) =>
    http.patch<ApiEnvelope<ApiUser>>("/users/me", body).then((r) => data(r.data)),
  changePassword: (body: ChangePasswordPayload) =>
    http.post<ApiEnvelope<null>>("/users/me/change-password", body).then(() => null),
};

// ─── Profile (self-service) ─────────────────────────────────────────────────

export const profilesApi = {
  // Returns null when the caller has no profile yet (404), so the settings
  // form can start empty instead of erroring.
  mine: () =>
    http
      .get<ApiEnvelope<ApiProfile>>("/profiles/me")
      .then((r) => data(r.data))
      .catch(() => null),
  upsertMine: (body: UpdateProfilePayload) =>
    http.put<ApiEnvelope<ApiProfile>>("/profiles/me", body).then((r) => data(r.data)),
};

// ─── NRC reference data ─────────────────────────────────────────────────────────

export const nrcApi = {
  getAll: () => http.get<ApiEnvelope<NrcData>>("/nrc").then((r) => data(r.data)),
};

// ─── Wallets ──────────────────────────────────────────────────────────────────

export const walletsApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    http.get<ApiEnvelope<Paged<ApiWallet>>>("/wallets", { params }).then((r) => data(r.data)),
  create: (body: CreateWalletPayload) =>
    http.post<ApiEnvelope<ApiWallet>>("/wallets", body).then((r) => data(r.data)),
  // Apply a signed delta to the real or virtual ledger (admin refill/deduct).
  adjust: (id: string, body: AdjustWalletPayload) =>
    http.post<ApiEnvelope<ApiWallet>>(`/wallets/${id}/adjust`, body).then((r) => data(r.data)),
};

export const walletFundingApi = {
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  } = {}) =>
    http
      .get<ApiEnvelope<Paged<ApiWalletFundingRequest>>>("/admin/wallet-funding-requests", {
        params,
      })
      .then((r) => data(r.data)),
  approve: (id: string, body: ApproveWalletFundingPayload) =>
    http
      .post<ApiEnvelope<ApiWalletFundingRequest>>(`/admin/wallet-funding-requests/${id}/approve`, body)
      .then((r) => data(r.data)),
  reject: (id: string, body: RejectWalletFundingPayload) =>
    http
      .post<ApiEnvelope<ApiWalletFundingRequest>>(`/admin/wallet-funding-requests/${id}/reject`, body)
      .then((r) => data(r.data)),
};

export const paymentMethodsApi = {
  listMine: () =>
    http.get<ApiEnvelope<ApiPaymentMethod[]>>("/payment-methods/me").then((r) => data(r.data)),
  create: (body: CreatePaymentMethodPayload) =>
    http.post<ApiEnvelope<ApiPaymentMethod>>("/payment-methods/", body).then((r) => data(r.data)),
  update: (id: string, body: UpdatePaymentMethodPayload) =>
    http
      .patch<ApiEnvelope<ApiPaymentMethod>>(`/payment-methods/${id}`, body)
      .then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/payment-methods/${id}`).then(() => null),
};

// ─── P2P Agents ────────────────────────────────────────────────────────────────

export const p2pApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    http.get<ApiEnvelope<Paged<ApiP2P>>>("/p2p", { params }).then((r) => data(r.data)),
  getById: (id: string) => http.get<ApiEnvelope<ApiP2P>>(`/p2p/${id}`).then((r) => data(r.data)),
  create: (body: CreateP2PPayload) =>
    http.post<ApiEnvelope<ApiP2P>>("/p2p/", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateP2PPayload) =>
    http.patch<ApiEnvelope<ApiP2P>>(`/p2p/${id}`, body).then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/p2p/${id}`).then(() => null),
  listApplications: (
    params: { page?: number; limit?: number; search?: string; status?: string } = {},
  ) =>
    http
      .get<ApiEnvelope<Paged<ApiP2PApplication>>>("/p2p/applications", { params })
      .then((r) => data(r.data)),
  getApplication: (id: string) =>
    http
      .get<ApiEnvelope<ApiP2PApplication>>(`/p2p/applications/${id}`)
      .then((r) => data(r.data)),
  getApplicationByUser: (userId: string) =>
    http
      .get<ApiEnvelope<ApiP2PApplication>>(`/p2p/applications/by-user/${userId}`)
      .then((r) => data(r.data)),
  approveApplication: (id: string, body: ApproveP2PApplicationPayload) =>
    http
      .post<ApiEnvelope<ApiP2PApplication>>(`/p2p/applications/${id}/approve`, body)
      .then((r) => data(r.data)),
  rejectApplication: (id: string, body: RejectP2PApplicationPayload) =>
    http
      .post<ApiEnvelope<ApiP2PApplication>>(`/p2p/applications/${id}/reject`, body)
      .then((r) => data(r.data)),
  updateApplicationPaymentMethods: (id: string, body: UpdateApplicationPaymentMethodsPayload) =>
    http
      .patch<ApiEnvelope<ApiP2PApplication>>(`/p2p/applications/${id}/payment-methods`, body)
      .then((r) => data(r.data)),
  listCryptoDeposits: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) =>
    http
      .get<ApiEnvelope<Paged<ApiCryptoDeposit>>>("/p2p/admin/crypto-deposits", { params })
      .then((r) => data(r.data)),
  approveCryptoDeposit: (id: string, body: ApproveCryptoDepositPayload) =>
    http
      .post<ApiEnvelope<ApiCryptoDeposit>>(`/p2p/admin/crypto-deposits/${id}/approve`, body)
      .then((r) => data(r.data)),
  rejectCryptoDeposit: (id: string, body: RejectCryptoDepositPayload) =>
    http
      .post<ApiEnvelope<ApiCryptoDeposit>>(`/p2p/admin/crypto-deposits/${id}/reject`, body)
      .then((r) => data(r.data)),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  listRealByUser: (userId: string, params: { page?: number; limit?: number } = {}) =>
    http
      .get<ApiEnvelope<Paged<ApiTransaction>>>(`/transactions/by-user/${userId}`, {
        params: { limit: 200, page: 1, ...params },
      })
      .then((r) => data(r.data)),
  listVirtualByUser: (userId: string, params: { page?: number; limit?: number } = {}) =>
    http
      .get<ApiEnvelope<Paged<ApiTransaction>>>(`/transactions/virtual/by-user/${userId}`, {
        params: { limit: 200, page: 1, ...params },
      })
      .then((r) => data(r.data)),
  /** @deprecated use listRealByUser */
  listByUser: (userId: string, params: { page?: number; limit?: number } = {}) =>
    transactionsApi.listRealByUser(userId, params),
  listByMarketItem: async (
    marketItemId: string,
    params: { page?: number; limit?: number } = {},
  ) => {
    const query = {
      page: 1,
      limit: 200,
      source_id: marketItemId,
      source_type: "MARKET_RESOLVE" as const,
      ...params,
    };
    const [realPage, virtualPage] = await Promise.all([
      http
        .get<ApiEnvelope<Paged<ApiTransaction>>>("/transactions", { params: query })
        .then((r) => data(r.data)),
      http
        .get<ApiEnvelope<Paged<ApiTransaction>>>("/transactions/virtual", { params: query })
        .then((r) => data(r.data)),
    ]);
    const items = [
      ...realPage.items.map((t) => ({ ...t, ledger: t.ledger ?? "real" })),
      ...virtualPage.items.map((t) => ({ ...t, ledger: t.ledger ?? "virtual" })),
    ];
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  },
};

// ─── Chat (admin mediation) ────────────────────────────────────────────────────

export const adminChatApi = {
  // Admin listing of all conversations, optionally scoped to one agent.
  listConversations: (
    params: { p2p_id?: string; search?: string; page?: number; limit?: number } = {},
  ) =>
    http
      .get<ApiEnvelope<Paged<ChatConversation>>>("/p2p/chat/admin/conversations", { params })
      .then((r) => data(r.data)),
  listMessages: (conversationId: string, params: { limit?: number; before?: string } = {}) =>
    http
      .get<ApiEnvelope<ChatMessage[]>>(`/p2p/chat/conversations/${conversationId}/messages`, {
        params,
      })
      .then((r) => data(r.data) ?? []),
  // Join an existing thread as a full participant so the admin can post.
  join: (conversationId: string) =>
    http
      .post<ApiEnvelope<ChatConversation>>(`/p2p/chat/conversations/${conversationId}/join`)
      .then((r) => data(r.data)),
  sendMessage: (conversationId: string, body: string) =>
    http
      .post<
        ApiEnvelope<ChatMessage>
      >(`/p2p/chat/conversations/${conversationId}/messages`, { body })
      .then((r) => data(r.data)),
  markRead: (conversationId: string) =>
    http.post(`/p2p/chat/conversations/${conversationId}/read`).then(() => undefined),
};

// ─── Platform crypto wallet (shared admin) ─────────────────────────────────────

export const platformCryptoWalletApi = {
  get: (chainId = 56) =>
    http
      .get<ApiEnvelope<PlatformCryptoWallet>>("/admin/platform-crypto-wallet", {
        params: { chain_id: chainId },
      })
      .then((r) => data(r.data)),
  list: () =>
    http
      .get<ApiEnvelope<PlatformCryptoWallet[]>>("/admin/platform-crypto-wallet", {
        params: { list: true },
      })
      .then((r) => data(r.data)),
  save: (body: SavePlatformCryptoWalletPayload) =>
    http
      .put<ApiEnvelope<PlatformCryptoWallet>>("/admin/platform-crypto-wallet", body)
      .then((r) => data(r.data)),
  clear: (chainId = 56) =>
    http
      .delete<ApiEnvelope<null>>("/admin/platform-crypto-wallet", {
        params: { chain_id: chainId },
      })
      .then(() => undefined),
};

// ─── Files (file-service) ─────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  url: string;
}

// Upload a single file to the file-service (via gateway). We use fetch rather
// than the axios instance so the browser sets the multipart boundary itself.
export async function uploadFile(file: File): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append("file", file);
  const base = API_BASE ? `${API_BASE}/api/v1` : "/api/v1";

  let res: Response;
  try {
    res = await fetch(`${base}/files/`, { method: "POST", body: fd, credentials: "include" });
  } catch {
    throw new Error(
      `Cannot reach the API${API_BASE ? ` at ${API_BASE}` : ""}. Is the gateway running?`,
    );
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<UploadedFile> | null;
  if (!res.ok || !json?.success || !json.data?.url) {
    throw new Error(json?.error || json?.message || `Upload failed (${res.status})`);
  }
  return { id: String(json.data.id), url: json.data.url };
}

// ─── Payment method types ─────────────────────────────────────────────────────

export const paymentMethodTypesApi = {
  list: (params?: { search?: string; include_disabled?: boolean; for_p2p?: boolean }) =>
    http
      .get<ApiEnvelope<ApiPaymentMethodType[]>>("/payment-method-types", { params })
      .then((r) => data(r.data)),
  create: (body: CreatePaymentMethodTypePayload) =>
    http
      .post<ApiEnvelope<ApiPaymentMethodType>>("/payment-method-types/", body)
      .then((r) => data(r.data)),
  update: (id: string, body: UpdatePaymentMethodTypePayload) =>
    http
      .patch<ApiEnvelope<ApiPaymentMethodType>>(`/payment-method-types/${id}`, body)
      .then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/payment-method-types/${id}`).then(() => null),
};

// ─── Market categories ───────────────────────────────────────────────────────

export const marketCategoriesApi = {
  list: (params?: { search?: string; include_disabled?: boolean }) =>
    http
      .get<ApiEnvelope<ApiMarketCategory[]>>("/market-categories", { params })
      .then((r) => data(r.data)),
  create: (body: CreateMarketCategoryPayload) =>
    http.post<ApiEnvelope<ApiMarketCategory>>("/market-categories", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateMarketCategoryPayload) =>
    http
      .patch<ApiEnvelope<ApiMarketCategory>>(`/market-categories/${id}`, body)
      .then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/market-categories/${id}`).then(() => null),
};

// ─── Roles ──────────────────────────────────────────────────────────────────

export const rolesApi = {
  list: (search?: string) =>
    http
      .get<ApiEnvelope<ApiRole[]>>("/roles", { params: search ? { search } : undefined })
      .then((r) => data(r.data)),
  create: (body: CreateRolePayload) =>
    http.post<ApiEnvelope<ApiRole>>("/roles/", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateRolePayload) =>
    http.patch<ApiEnvelope<ApiRole>>(`/roles/${id}`, body).then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/roles/${id}`).then(() => null),
  setModules: (id: string, moduleIds: string[]) =>
    http
      .put<ApiEnvelope<ApiRole>>(`/roles/${id}/modules`, { module_ids: moduleIds })
      .then((r) => data(r.data)),
};

// ─── Modules ──────────────────────────────────────────────────────────────────

export const modulesApi = {
  list: (search?: string) =>
    http
      .get<ApiEnvelope<ApiModule[]>>("/modules", { params: search ? { search } : undefined })
      .then((r) => data(r.data)),
  create: (body: CreateModulePayload) =>
    http.post<ApiEnvelope<ApiModule>>("/modules/", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateModulePayload) =>
    http.patch<ApiEnvelope<ApiModule>>(`/modules/${id}`, body).then((r) => data(r.data)),
  remove: (id: string) => http.delete(`/modules/${id}`).then(() => null),
};

// ─── Markets ──────────────────────────────────────────────────────────────────
export const marketsApi = {
  list: (params?: { search?: string; page?: number; limit?: number; view?: "management" | "history" }) =>
    http.get<ApiEnvelope<Paged<Market>>>("/markets", { params }).then((r) => data(r.data)),
  get: (id: string) => http.get<ApiEnvelope<Market>>(`/markets/${id}`).then((r) => data(r.data)),
  create: (body: CreateMarketInput) =>
    http.post<ApiEnvelope<Market>>("/markets", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateMarketInput) =>
    http.patch<ApiEnvelope<Market>>(`/markets/${id}`, body).then((r) => data(r.data)),
  delete: (id: string) =>
    http.delete<ApiEnvelope<{ deleted: boolean }>>(`/markets/${id}`).then((r) => data(r.data)),
  publish: (id: string) =>
    http.post<ApiEnvelope<Market>>(`/markets/publish/${id}`).then((r) => data(r.data)),
  resolve: (id: string, body: ResolveMarketInput) =>
    http.post<ApiEnvelope<Market>>(`/markets/resolve/${id}`, body).then((r) => data(r.data)),
  cancel: (id: string) =>
    http.post<ApiEnvelope<Market>>(`/markets/cancel/${id}`).then((r) => data(r.data)),
  getAffiliateStats: (id: string) =>
    http
      .get<ApiEnvelope<MarketAffiliateStats>>(`/admin/markets/${id}/affiliate-stats`)
      .then((r) => data(r.data)),
  updateAffiliateRate: (id: string, body: { affiliate_rate_percent: number; reason?: string }) =>
    http
      .patch<ApiEnvelope<MarketAffiliateStats>>(`/admin/markets/${id}/affiliate-rate`, body)
      .then((r) => data(r.data)),
  getPlatformStats: () =>
    http.get<ApiEnvelope<PlatformStats>>("/admin/markets/platform-stats").then((r) => data(r.data)),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getPlatformStats: () => marketsApi.getPlatformStats(),
};

// ─── Banners (promotional image banners) ──────────────────────────────────────

export interface ApiBanner {
  id: string;
  image_url: string;
  link_url: string;
  /** 'messenger' = external link opened in new tab; 'market' = in-app navigation */
  link_type: "messenger" | "market";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateBannerPayload {
  image_url: string;
  link_url: string;
  link_type: "messenger" | "market";
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateBannerPayload {
  image_url?: string;
  link_url?: string;
  link_type?: "messenger" | "market";
  sort_order?: number;
  is_active?: boolean;
}

export interface ReorderBannerItem {
  id: string;
  sort_order: number;
}

export const bannersApi = {
  list: (activeOnly = false) =>
    http
      .get<ApiEnvelope<ApiBanner[]>>("/banners", { params: { active: activeOnly } })
      .then((r) => data(r.data)),
  create: (body: CreateBannerPayload) =>
    http.post<ApiEnvelope<ApiBanner>>("/banners", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateBannerPayload) =>
    http.patch<ApiEnvelope<ApiBanner>>(`/banners/${id}`, body).then((r) => data(r.data)),
  remove: (id: string) =>
    http.delete<ApiEnvelope<{ deleted: boolean }>>(`/banners/${id}`).then((r) => data(r.data)),
  reorder: (items: ReorderBannerItem[]) =>
    http
      .put<ApiEnvelope<ApiBanner[]>>("/banners/reorder", { items })
      .then((r) => data(r.data)),
};

// ─── Market Items ──────────────────────────────────────────────────────────────────
export const marketItemsApi = {
  list: (search?: string) =>
    http
      .get<ApiEnvelope<Paged<MarketItem>>>("/market-items", {
        params: search ? { search } : undefined,
      })
      .then((r) => data(r.data)),
  create: (body: CreateMarketItemInput) =>
    http.post<ApiEnvelope<MarketItem>>("/market-items", body).then((r) => data(r.data)),
  update: (id: string, body: UpdateMarketItemInput) =>
    http.patch<ApiEnvelope<MarketItem>>(`/market-items/${id}`, body).then((r) => data(r.data)),
  delete: (id: string) =>
    http.delete<ApiEnvelope<{ deleted: boolean }>>(`/market-items/${id}`).then((r) => data(r.data)),
  resolve: (id: string, body: ResolveMarketItemInput) =>
    http
      .post<ApiEnvelope<MarketItem>>(`/market-items/resolve/${id}`, body)
      .then((r) => data(r.data)),
  cancel: (id: string) =>
    http.post<ApiEnvelope<MarketItem>>(`/market-items/cancel/${id}`).then((r) => data(r.data)),
  history: (params?: {
    page?: number;
    limit?: number;
    ledger?: "real" | "virtual";
    user_id?: string;
    market_item_id?: string;
  }) => http.get<ApiEnvelope<Paged<BetHistory>>>("/bets", { params }).then((r) => data(r.data)),
};

export type SettlementJobStatus = "pending" | "running" | "completed" | "failed";

export type SettlementStatus = {
  market_item_id: string;
  status: SettlementJobStatus;
  total_bets: number;
  processed_bets: number;
  failed_bets: number;
  real_credited: number;
  virtual_credited: number;
  last_error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export const settlementApi = {
  status: (marketItemId: string) =>
    http
      .get<ApiEnvelope<SettlementStatus>>(`/bets/settlement/${marketItemId}/status`)
      .then((r) => data(r.data)),
  retry: (marketItemId: string) =>
    http
      .post<ApiEnvelope<SettlementStatus>>(`/bets/settlement/${marketItemId}/retry`)
      .then((r) => data(r.data)),
};

// ─── Telegram ─────────────────────────────────────────────────────────────────

export const telegramApi = {
  getSettings: () =>
    http.get<ApiEnvelope<TelegramSettings>>("/telegram/settings").then((r) => data(r.data)),
  updateSettings: (body: UpdateTelegramSettingsPayload) =>
    http.patch<ApiEnvelope<TelegramSettings>>("/telegram/settings", body).then((r) => data(r.data)),
  sendChannelMessage: (text: string) =>
    http
      .post<ApiEnvelope<unknown>>("/telegram/channel/messages", { text })
      .then((r) => r.data),
};

// ─── Load test (super_admin, LOAD_TEST_ENABLED) ─────────────────────────────

export type LoadTestRunStatus =
  | "configured"
  | "markets_seeded"
  | "users_seeded"
  | "tokens_minted"
  | "cleaned";

export interface LoadTestMarketRow {
  market_id: string;
  market_item_id: string;
  yes_option_id: string;
  no_option_id: string;
  one_share_price: number;
  sort_order: number;
}

export interface LoadTestRun {
  run_id: string;
  gateway_url: string;
  concurrency: number;
  players: number;
  market_count: number;
  wallet_balance: number;
  think_min_ms: number;
  think_max_ms: number;
  duration: string;
  seed_yes_count?: number;
  seed_no_count?: number;
  status: LoadTestRunStatus;
  users_seeded: number;
  markets_seeded: number;
  markets?: LoadTestMarketRow[];
  created_at: string;
  updated_at: string;
}

export interface CreateLoadTestRunPayload {
  run_id: string;
  gateway_url: string;
  concurrency: number;
  players: number;
  market_count?: number;
  wallet_balance?: number;
  think_min_ms?: number;
  think_max_ms?: number;
  duration?: string;
  seed_yes_count?: number;
  seed_no_count?: number;
}

export interface LoadTestMintTokensResult {
  run_id: string;
  count: number;
  expires_at: string;
  tokens: { user_id: string; email: string; token: string }[];
}

export interface LoadTestCleanupResult {
  run_id: string;
  users_deleted: number;
  markets_deleted: number;
  markets_failed?: number;
  errors?: string[];
}

export const loadTestApi = {
  createRun: (body: CreateLoadTestRunPayload) =>
    http.post<ApiEnvelope<LoadTestRun>>("/admin/load-test/runs", body).then((r) => data(r.data)),
  getRun: (runId: string) =>
    http.get<ApiEnvelope<LoadTestRun>>(`/admin/load-test/runs/${runId}`).then((r) => data(r.data)),
  seedMarkets: (runId: string, force = false, seed?: Pick<CreateLoadTestRunPayload, "seed_yes_count" | "seed_no_count">) =>
    http
      .post<ApiEnvelope<LoadTestRun>>(
        `/admin/load-test/runs/${runId}/seed-markets${force ? "?force=true" : ""}`,
        seed?.seed_yes_count != null || seed?.seed_no_count != null
          ? { seed_yes_count: seed.seed_yes_count, seed_no_count: seed.seed_no_count }
          : undefined,
      )
      .then((r) => data(r.data)),
  seedUsers: (runId: string) =>
    http
      .post<ApiEnvelope<LoadTestRun>>(`/admin/load-test/runs/${runId}/seed-users`)
      .then((r) => data(r.data)),
  mintTokens: (runId: string) =>
    http
      .post<ApiEnvelope<LoadTestMintTokensResult>>(`/admin/load-test/runs/${runId}/mint-tokens`)
      .then((r) => data(r.data)),
  cleanup: (runId: string) =>
    http
      .post<ApiEnvelope<LoadTestCleanupResult>>(`/admin/load-test/runs/${runId}/cleanup`)
      .then((r) => data(r.data)),
  cliCommand: (runId: string) =>
    http
      .get<ApiEnvelope<{ run_id: string; command: string }>>(`/admin/load-test/runs/${runId}/cli-command`)
      .then((r) => data(r.data)),
  marketsFile: (runId: string) =>
    http
      .get<ApiEnvelope<{ run_id: string; markets: LoadTestMarketRow[] }>>(
        `/admin/load-test/runs/${runId}/markets-file`,
      )
      .then((r) => data(r.data)),
};

// ─── Files (file-service) ─────────────────────────────────────────────────────

export const fileApi = {
  // Use fetch so the browser sets multipart boundaries (axios default JSON header breaks uploads).
  create: async (body: FormData): Promise<ApiEnvelope<FileResponse>> => {
    const base = API_BASE ? `${API_BASE}/api/v1` : "/api/v1";
    let res: Response;
    try {
      res = await fetch(`${base}/files/`, { method: "POST", body, credentials: "include" });
    } catch {
      throw new Error(
        `Cannot reach the API${API_BASE ? ` at ${API_BASE}` : ""}. Is the gateway running?`,
      );
    }
    const json = (await res.json().catch(() => null)) as ApiEnvelope<FileResponse> | null;
    if (!res.ok || !json) {
      throw new Error(json?.error || json?.message || `Upload failed (${res.status})`);
    }
    return json;
  },
};
