import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, QrCode, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NetworkPicker } from "@/components/wallet/NetworkPicker";
import { shortenAddress, useCryptoWallet } from "@/hooks/useCryptoWallet";
import { usePlatformCryptoWallet } from "@/hooks/usePlatformCryptoWallet";
import {
  clearPlatformCryptoWallet,
  platformCryptoWalletQueryKey,
} from "@/lib/web3/syncPlatformCryptoWallet";
import { cn } from "@/lib/utils";

export function PlatformCryptoWalletSection({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const crypto = useCryptoWallet();
  const { savedAddress } = usePlatformCryptoWallet();
  const [removeOpen, setRemoveOpen] = useState(false);

  const displayAddress = crypto.isConnected ? crypto.address : savedAddress;
  const addressLabel = crypto.isConnected ? "Connected address" : "Saved platform address";
  const removeTargetAddress = crypto.address ?? savedAddress;
  const walletBusy = crypto.disconnecting || crypto.removing;

  const handleRemove = async () => {
    crypto.setRemoving(true);
    try {
      await clearPlatformCryptoWallet(crypto.targetChainId);
      await qc.invalidateQueries({ queryKey: platformCryptoWalletQueryKey(crypto.targetChainId) });
      if (crypto.isConnected) {
        await crypto.disconnectAsync();
      }
      toast.success("Shared platform wallet removed");
      setRemoveOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not remove platform wallet";
      toast.error(message);
    } finally {
      crypto.setRemoving(false);
    }
  };

  if (!crypto.enabled) {
    return (
      <div className={cn(!embedded && "rounded-2xl border border-border/60 bg-card p-6")}>
        <h2 className="text-base font-semibold">Crypto wallet</h2>
        <p className="mt-2 text-sm text-amber-500">
          WalletConnect is not configured. Set{" "}
          <code className="text-xs">VITE_WALLETCONNECT_PROJECT_ID</code> in the environment.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn(!embedded && "rounded-2xl border border-border/60 bg-card p-6")}>
        <div className="mb-4 space-y-2">
          <h2 className="text-base font-semibold">Crypto wallet</h2>
          <p className="text-sm text-muted-foreground">
            Connect via WalletConnect to set the shared platform USDT wallet on your selected network.
          </p>
          <div
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
            role="note"
          >
            Shared platform wallet — all admin staff see the same address per network. Connecting a
            new wallet replaces it for everyone on that network.
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-elevated/40 p-4 space-y-4">
          <NetworkPicker
            label="Network"
            helperText="Choose the blockchain network for the shared platform receive wallet."
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active network</p>
              <p className="mt-0.5 text-sm font-medium">{crypto.chainName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-medium",
                  crypto.isConnected ? "text-emerald-500" : "text-muted-foreground",
                )}
              >
                {crypto.isConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          {displayAddress && (
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">{addressLabel}</p>
                {savedAddress && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    Saved for all admins
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-sm break-all" title={displayAddress}>
                {displayAddress}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{shortenAddress(displayAddress)}</p>
            </div>
          )}

          {!crypto.isConnected && savedAddress && (
            <p className="text-sm text-muted-foreground">
              A platform wallet is already saved. Connect a different wallet to replace it for all
              admins.
            </p>
          )}

          {crypto.isWrongChain && (
            <p className="text-sm text-amber-500">
              Switch to {crypto.chainName} before saving the platform wallet.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!crypto.isConnected ? (
              <>
                <Button
                  type="button"
                  onClick={() => crypto.connect()}
                  disabled={crypto.connecting || walletBusy || !crypto.canConnect}
                  className="font-semibold"
                  aria-busy={crypto.connecting}
                >
                  {crypto.connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <QrCode className="h-4 w-4" aria-hidden />
                  )}
                  Connect wallet
                </Button>
                {savedAddress && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoveOpen(true)}
                    disabled={walletBusy}
                    aria-label="Remove shared platform crypto wallet"
                  >
                    {crypto.removing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                    Remove wallet
                  </Button>
                )}
              </>
            ) : (
              <>
                {crypto.isWrongChain && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => crypto.switchToTargetChain()}
                    disabled={crypto.switching || walletBusy}
                  >
                    {crypto.switching ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    Switch to {crypto.chainName}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => crypto.disconnect()}
                  disabled={walletBusy}
                  aria-label="Disconnect wallet session"
                >
                  {crypto.disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Unlink className="h-4 w-4" aria-hidden />
                  )}
                  Disconnect
                </Button>
                {savedAddress && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoveOpen(true)}
                    disabled={walletBusy}
                    aria-label="Remove shared platform crypto wallet"
                  >
                    {crypto.removing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                    Remove wallet
                  </Button>
                )}
              </>
            )}
          </div>

          {crypto.isConnected && (
            <p className="text-xs text-muted-foreground">
              Your connected address is saved automatically as the shared platform wallet.
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove shared platform wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the crypto wallet for all admin staff. Anyone can connect a new wallet
              afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {removeTargetAddress && (
            <p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
              {removeTargetAddress}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={crypto.removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              disabled={crypto.removing}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
            >
              {crypto.removing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Remove wallet"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
