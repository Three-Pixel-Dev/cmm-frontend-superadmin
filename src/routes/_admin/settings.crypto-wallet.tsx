import { createFileRoute } from "@tanstack/react-router";
import { PlatformCryptoWalletSection } from "@/components/wallet/PlatformCryptoWalletSection";

export const Route = createFileRoute("/_admin/settings/crypto-wallet")({
  head: () => ({ meta: [{ title: "Crypto wallet — Settings — SuperCash Admin" }] }),
  component: CryptoWalletSettingsPage,
});

function CryptoWalletSettingsPage() {
  return <PlatformCryptoWalletSection embedded />;
}
