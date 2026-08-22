import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { useCryptoNetwork } from "@/components/providers/CryptoNetworkProvider";
import { getChain } from "@/lib/web3/chains";
import { isWalletConnectEnabled } from "@/lib/web3/walletConnect";

function pickWalletConnectConnector(connectors: ReturnType<typeof useConnectors>) {
  return connectors.find((c) => c.type === "walletConnect");
}

export function shortenAddress(address: string, head = 6, tail = 4) {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

type UseCryptoWalletOptions = {
  requiredChainId?: number;
};

export function useCryptoWallet(options: UseCryptoWalletOptions = {}) {
  const { selectedChainId, selectedChain } = useCryptoNetwork();
  const targetChainId = options.requiredChainId ?? selectedChainId;
  const targetChain = getChain(targetChainId) ?? selectedChain;

  const enabled = isWalletConnectEnabled();
  const { address, chainId, isConnected } = useAccount();
  const connectors = useConnectors();
  const wcConnector = pickWalletConnectConnector(connectors);
  const { connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();

  const isOnTargetChain = chainId === targetChainId;
  const isWrongChain = isConnected && !isOnTargetChain;
  const ready = isConnected && isOnTargetChain;

  const connect = useCallback(async () => {
    if (!enabled) {
      toast.error("WalletConnect is not configured.");
      return false;
    }
    if (!wcConnector) {
      toast.error("WalletConnect is still loading.");
      return false;
    }
    try {
      await connectAsync({ connector: wcConnector, chainId: targetChainId });
      toast.success("Wallet connected");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not connect wallet";
      if (!message.toLowerCase().includes("rejected")) toast.error(message);
      return false;
    }
  }, [connectAsync, enabled, targetChainId, wcConnector]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync();
      toast.success("Wallet disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disconnect wallet");
    }
  }, [disconnectAsync]);

  const [removing, setRemoving] = useState(false);

  const switchToTargetChain = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: targetChainId });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch network");
      return false;
    }
  }, [switchChainAsync, targetChainId]);

  return {
    enabled,
    ready,
    address,
    chainId,
    targetChainId,
    isConnected,
    isOnTargetChain,
    isWrongChain,
    connecting,
    disconnecting,
    removing,
    setRemoving,
    switching,
    canConnect: enabled && Boolean(wcConnector),
    chainName: targetChain.name,
    chainShortName: targetChain.shortName,
    connect,
    disconnect,
    switchToTargetChain,
    switchToBsc: switchToTargetChain,
    isOnBsc: isOnTargetChain,
  };
}
