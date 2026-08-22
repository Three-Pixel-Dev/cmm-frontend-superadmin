import type { ApiPaymentMethodType } from "@/lib/admin/types";

const CRYPTO_TYPE_NAMES = new Set(["Crypto", "MetaMask"]);

export function isFiatPaymentMethodType(type: Pick<ApiPaymentMethodType, "name">): boolean {
  return !CRYPTO_TYPE_NAMES.has(type.name);
}

export function fiatPaymentMethodTypes(types: ApiPaymentMethodType[]): ApiPaymentMethodType[] {
  return types.filter(isFiatPaymentMethodType);
}

/** Keep selected types visible even when admin-disabled. */
export function mergeSelectedPaymentTypes(
  enabled: ApiPaymentMethodType[],
  all: ApiPaymentMethodType[],
  selectedIds: string[],
): ApiPaymentMethodType[] {
  const byId = new Map(enabled.map((t) => [t.id, t]));
  for (const id of selectedIds) {
    if (byId.has(id)) continue;
    const found = all.find((t) => t.id === id);
    if (found) byId.set(id, found);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
