import { useQuery } from "@tanstack/react-query";
import { platformCryptoWalletApi } from "@/lib/admin/api";
import { useCryptoNetwork } from "@/components/providers/CryptoNetworkProvider";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/chains";
import { platformCryptoWalletQueryKey } from "@/lib/web3/syncPlatformCryptoWallet";

export function usePlatformCryptoWallet(chainId?: number) {
  const { selectedChainId } = useCryptoNetwork();
  const effectiveChainId = chainId ?? selectedChainId ?? DEFAULT_CHAIN_ID;

  const walletQ = useQuery({
    queryKey: platformCryptoWalletQueryKey(effectiveChainId),
    queryFn: () => platformCryptoWalletApi.get(effectiveChainId),
  });

  const savedAddress = walletQ.data?.address?.trim() || undefined;

  return {
    walletQ,
    chainId: effectiveChainId,
    savedAddress,
    hasSavedWallet: Boolean(savedAddress),
  };
}
