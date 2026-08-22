// Types mirroring the Go user-service response DTOs (internal/response/*.go).

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

export interface ApiUser {
  id: string;
  role_id: string;
  role_name?: string;
  name: string;
  fullname?: string;
  email: string;
  is_enable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiModule {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_enable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiRole {
  id: string;
  name: string;
  description?: string;
  is_enable: boolean;
  user_count: number;
  modules: ApiModule[];
  created_at: string;
  updated_at: string;
}

export interface ApiProfile {
  id: string;
  user_id: string;
  age?: number;
  date_of_birth?: string;
  profile_url?: string;
  gender?: string;
  phone_number?: string;
  nrc?: string;
  passport?: string;
  address?: string;
  nationality?: string;
  is_enable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiWallet {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  amount: string;
  virtual_amount: string;
  is_enable: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdjustWalletPayload {
  ledger: "real" | "virtual";
  delta: string;
  reason?: string;
}

export interface CreateWalletPayload {
  user_id: string;
  amount?: string;
  virtual_amount?: string;
}

export interface ApiP2P {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  from_range: string;
  to_range: string;
  commission_rate: string;
  complete_percentage: string;
  trade_count: number;
  is_enable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateP2PPayload {
  user_id: string;
  from_range: string;
  to_range: string;
  commission_rate: string;
}

export interface UpdateP2PPayload {
  from_range?: string;
  to_range?: string;
  commission_rate?: string;
  complete_percentage?: string;
  trade_count?: number;
  is_enable?: boolean;
}

export type P2PApplicationStatus = "pending" | "approved" | "rejected";

export interface ApiP2PApplication {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  proposed_commission_rate: string;
  note?: string;
  nrc_front_url?: string;
  nrc_back_url?: string;
  platform_purchase_payment_methods?: string[];
  user_trade_payment_methods?: string[];
  working_capital?: string;
  previous_experience?: string;
  application_purpose?: string;
  income_preference?: string;
  status: P2PApplicationStatus;
  reject_reason?: string;
  reviewed_at?: string;
  p2p_id?: string;
  phone_number?: string;
  address?: string;
  nationality?: string;
  nrc?: string;
  passport?: string;
  created_at: string;
  updated_at: string;
}

export interface ApproveP2PApplicationPayload {
  from_range: string;
  to_range: string;
  commission_rate: string;
}

export interface RejectP2PApplicationPayload {
  reject_reason?: string;
}

export interface UpdateApplicationPaymentMethodsPayload {
  platform_purchase_payment_methods: string[];
  user_trade_payment_methods: string[];
}

export interface UserPermissions {
  user_id: string;
  role_id: string;
  codes: string[];
  modules: ApiModule[];
}

export interface AuthResult {
  user: ApiUser;
}

// ─── Request payloads ──────────────────────────────────────────────────────────

export interface CreateUserPayload {
  role_id: string;
  name: string;
  fullname?: string;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  role_id?: string;
  name?: string;
  fullname?: string;
  email?: string;
  password?: string;
  is_enable?: boolean;
}

export interface UpdateMePayload {
  name?: string;
  fullname?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordResult {
  temporary_password: string;
}

export interface UpdateProfilePayload {
  age?: number | null;
  date_of_birth?: string | null;
  profile_url?: string;
  gender?: string;
  phone_number?: string;
  nrc?: string;
  passport?: string;
  address?: string;
  nationality?: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  is_enable?: boolean;
}

export interface CreateModulePayload {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateModulePayload {
  code?: string;
  name?: string;
  description?: string;
  is_enable?: boolean;
}

export interface ApiPaymentMethodType {
  id: string;
  name: string;
  photo_url?: string;
  is_enable: boolean;
  is_enable_for_p2p: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodTypePayload {
  name: string;
  photo_url?: string;
  is_enable?: boolean;
  is_enable_for_p2p?: boolean;
}

export interface UpdatePaymentMethodTypePayload {
  name?: string;
  photo_url?: string;
  is_enable?: boolean;
  is_enable_for_p2p?: boolean;
}

export interface ApiPaymentMethod {
  id: string;
  name?: string;
  address: string;
  payment_method_type_id: string;
  chain_id?: number;
  type: Pick<ApiPaymentMethodType, "id" | "name" | "photo_url">;
  is_default: boolean;
  is_enable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodPayload {
  name?: string;
  address: string;
  payment_method_type_id: string;
  chain_id?: number;
  is_default?: boolean;
}

export interface UpdatePaymentMethodPayload {
  name?: string;
  address?: string;
  payment_method_type_id?: string;
  chain_id?: number;
  is_default?: boolean;
}

export interface TelegramSettings {
  market_bot_enabled: boolean;
  market_message_template: string;
  default_market_message_template: string;
  p2p_low_balance_threshold: string;
  updated_at: string;
}

export interface UpdateTelegramSettingsPayload {
  market_bot_enabled?: boolean;
  market_message_template?: string;
  p2p_low_balance_threshold?: string;
}

export interface PlatformCryptoWallet {
  address?: string;
  chain_id: number;
  updated_at: string;
  updated_by?: string;
}

export interface SavePlatformCryptoWalletPayload {
  address: string;
  chain_id?: number;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface ApiTransaction {
  id: string;
  ledger?: string;
  user_id: string;
  wallet_id?: string;
  slip_url?: string;
  tran_type?: "credit" | "debit";
  source_type?:
    | "ADMIN"
    | "P2P"
    | "MARKET_RESOLVE"
    | "META_MASK"
    | "MARKET_BET"
    | "MARKET_AFFILIATE"
    | "WALLET_FUNDING";
  amount: string;
  type?: "deposit" | "withdraw" | "sell" | "transfer";
  status?: "pending" | "success" | "fail";
  commission_rate?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = "customer" | "p2p" | "admin";

export interface ChatUserBrief {
  id: string;
  name?: string;
  email?: string;
  role?: ChatRole;
}

export interface ChatConversation {
  id: string;
  p2p_id?: string;
  customer: ChatUserBrief;
  agent: ChatUserBrief;
  counterpart: ChatUserBrief;
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: ChatUserBrief;
  sender_role: ChatRole;
  body: string;
  attachment_url?: string;
  created_at: string;
}

/** Shape of the `chat.message` event published over `user.<id>.chat`. */
export interface ChatMessageEvent {
  eventType: "chat.message";
  conversation_id: string;
  message: ChatMessage;
}

export type P2PTradeRequestStatus = "pending" | "processing" | "completed" | "cancelled";
export type P2PTradeRequestType = "buy" | "sell";

export interface ApiP2PTradeRequestPaymentType {
  id: string;
  name: string;
  photo_url?: string;
}

export interface ApiP2PTradeRequest {
  id: string;
  p2p_id: string;
  type: P2PTradeRequestType;
  amount: string;
  commission: string;
  status: P2PTradeRequestStatus;
  notes?: string;
  reject_reason?: string;
  slip_url?: string;
  meta_mask_trx_id?: string;
  usdt_amount?: string;
  chain_id?: number;
  pay_with_crypto?: boolean;
  agent_payment_method_id?: string;
  transaction_id?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  requester: {
    id: string;
    name?: string;
    email?: string;
  };
  agent?: {
    id: string;
    user_id: string;
    name?: string;
    email?: string;
  };
  payment_method: {
    id: string;
    type: ApiP2PTradeRequestPaymentType;
  };
}

export interface ApiAgentPaymentMethod {
  id: string;
  name?: string;
  address: string;
  chain_id?: number;
  is_default: boolean;
}

export type CryptoDepositStatus = "approving" | "pending" | "approved" | "rejected";

export interface ApiCryptoDeposit {
  id: string;
  p2p_id: string;
  agent_user_id: string;
  chain_id: number;
  usdt_amount: string;
  mmk_amount?: string;
  meta_mask_trx_id?: string;
  agent_wallet_address?: string;
  approving_expires_at?: string;
  platform_address: string;
  status: CryptoDepositStatus;
  reject_reason?: string;
  reviewed_at?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  agent: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface ApproveCryptoDepositPayload {
  mmk_amount: string;
}

export interface RejectCryptoDepositPayload {
  reject_reason?: string;
}

export type WalletFundingStatus = "pending" | "approved" | "rejected" | "cancelled";
export type WalletFundingType = "deposit" | "withdraw";

export interface ApiWalletFundingRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  type: WalletFundingType;
  amount: string;
  approved_amount?: string;
  slip_url?: string;
  payment_method_id?: string;
  status: WalletFundingStatus;
  reject_reason?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; fullname?: string; email: string };
  payment_method?: ApiPaymentMethod;
}

export interface ApproveWalletFundingPayload {
  approved_amount?: string;
  admin_note?: string;
}

export interface RejectWalletFundingPayload {
  reason: string;
  admin_note?: string;
}
