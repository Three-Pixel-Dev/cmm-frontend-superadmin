import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCryptoNetwork } from "@/components/providers/CryptoNetworkProvider";
import { useCryptoWallet } from "@/hooks/useCryptoWallet";
import { useAuth } from "@/store/useAuth";
import {
  platformCryptoWalletQueryKey,
  savePlatformCryptoWallet,
} from "@/lib/web3/syncPlatformCryptoWallet";

export function PlatformCryptoWalletSync() {
  const qc = useQueryClient();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { selectedChainId } = useCryptoNetwork();
  const { address, ready } = useCryptoWallet();
  const lastSyncedRef = useRef<string | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !ready || !address) {
      if (!address) {
        lastSyncedRef.current = null;
      }
      return;
    }

    const syncKey = `${selectedChainId}:${address}`;
    if (lastSyncedRef.current === syncKey || syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        await savePlatformCryptoWallet(address, selectedChainId);
        if (cancelled) return;

        lastSyncedRef.current = syncKey;
        await qc.invalidateQueries({ queryKey: platformCryptoWalletQueryKey(selectedChainId) });
        toast.success("Shared platform wallet updated");
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Could not save platform wallet";
        toast.error(message);
      } finally {
        syncingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isLoggedIn, qc, ready, selectedChainId]);

  return null;
}
