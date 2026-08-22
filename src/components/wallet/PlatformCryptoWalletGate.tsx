import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress, useCryptoWallet } from "@/hooks/useCryptoWallet";
import { usePlatformCryptoWallet } from "@/hooks/usePlatformCryptoWallet";
import { getChain } from "@/lib/web3/chains";

export function PlatformCryptoWalletGate({
  children,
  className,
  requiredChainId,
}: {
  children?: ReactNode;
  className?: string;
  requiredChainId?: number;
}) {
  const crypto = useCryptoWallet({ requiredChainId });
  const { savedAddress, hasSavedWallet } = usePlatformCryptoWallet(crypto.targetChainId);
  const networkName = getChain(crypto.targetChainId)?.name ?? crypto.chainName;
  const platformMatch =
    savedAddress &&
    crypto.address &&
    savedAddress.toLowerCase() === crypto.address.toLowerCase();

  if (!crypto.enabled) {
    return <p className="text-sm text-amber-500">WalletConnect is not configured.</p>;
  }

  if (!hasSavedWallet) {
    return (
      <div className={className}>
        <p className="mb-3 text-xs text-muted-foreground">
          Connect the platform shared wallet in Settings → Crypto wallet before paying.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/settings/crypto-wallet">Open crypto wallet settings</Link>
        </Button>
      </div>
    );
  }

  if (!crypto.isConnected) {
    return (
      <div className={className}>
        <p className="mb-3 text-xs text-muted-foreground">
          Connect the platform wallet ({shortenAddress(savedAddress!)}) to send USDT.
        </p>
        <Button
          type="button"
          onClick={() => crypto.connect()}
          disabled={crypto.connecting || !crypto.canConnect}
          className="w-full h-11"
          aria-busy={crypto.connecting}
        >
          {crypto.connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <QrCode className="h-4 w-4" aria-hidden />
          )}
          Connect platform wallet
        </Button>
      </div>
    );
  }

  if (crypto.isWrongChain) {
    return (
      <div className={className}>
        <p className="mb-3 text-xs text-amber-500">Switch to {networkName} to continue.</p>
        <Button
          type="button"
          onClick={() => crypto.switchToTargetChain()}
          disabled={crypto.switching}
          className="w-full"
          aria-busy={crypto.switching}
        >
          {crypto.switching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Switch to {networkName}
        </Button>
      </div>
    );
  }

  if (!platformMatch) {
    return (
      <div className={className}>
        <p className="mb-3 text-xs text-amber-500">
          Connected wallet does not match the platform wallet ({shortenAddress(savedAddress!)}).
          Connect the correct wallet in Settings.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/settings/crypto-wallet">Open crypto wallet settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="mb-3 text-xs text-muted-foreground font-mono">
        Platform wallet: {shortenAddress(crypto.address!)}
      </p>
      {children}
    </div>
  );
}
