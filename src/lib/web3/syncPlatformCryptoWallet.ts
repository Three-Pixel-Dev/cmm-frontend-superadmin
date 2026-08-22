import { getAddress, isAddress } from "viem";
import { platformCryptoWalletApi } from "@/lib/admin/api";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/chains";

export const PLATFORM_CRYPTO_WALLET_QUERY_KEY = ["admin", "platform-crypto-wallet"] as const;

export function platformCryptoWalletQueryKey(chainId: number) {
  return [...PLATFORM_CRYPTO_WALLET_QUERY_KEY, chainId] as const;
}

export function normalizeEthAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error("Invalid wallet address");
  }
  return getAddress(address);
}

export async function getPlatformCryptoWallet(chainId = DEFAULT_CHAIN_ID) {
  return platformCryptoWalletApi.get(chainId);
}

export async function listPlatformCryptoWallets() {
  return platformCryptoWalletApi.list();
}

export async function savePlatformCryptoWallet(address: string, chainId = DEFAULT_CHAIN_ID) {
  const normalized = normalizeEthAddress(address);
  return platformCryptoWalletApi.save({ address: normalized, chain_id: chainId });
}

export async function clearPlatformCryptoWallet(chainId = DEFAULT_CHAIN_ID) {
  return platformCryptoWalletApi.clear(chainId);
}
