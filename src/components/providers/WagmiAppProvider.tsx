import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { CryptoNetworkProvider } from "@/components/providers/CryptoNetworkProvider";
import { PlatformCryptoWalletSync } from "@/components/wallet/PlatformCryptoWalletSync";
import { getWagmiConfig } from "@/lib/web3/config";

export function WagmiAppProvider({ children }: { children: ReactNode }) {
  const [config] = useState(() => getWagmiConfig(true));

  useEffect(() => {
    getWagmiConfig(true);
  }, []);

  return (
    <WagmiProvider config={config} reconnectOnMount>
      <CryptoNetworkProvider>
        <PlatformCryptoWalletSync />
        {children}
      </CryptoNetworkProvider>
    </WagmiProvider>
  );
}
