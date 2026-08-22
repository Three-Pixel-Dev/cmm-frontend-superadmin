import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CHAIN_ID,
  getChain,
  isSupportedChainId,
  SUPPORTED_CHAINS,
  type SupportedChain,
} from "@/lib/web3/chains";

const STORAGE_KEY = "cmm-crypto-chain-id";

type CryptoNetworkContextValue = {
  selectedChainId: number;
  selectedChain: SupportedChain;
  setSelectedChainId: (chainId: number) => void;
  supportedChains: SupportedChain[];
};

const CryptoNetworkContext = createContext<CryptoNetworkContextValue | null>(null);

function readStoredChainId(): number {
  if (typeof window === "undefined") return DEFAULT_CHAIN_ID;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_CHAIN_ID;
  const parsed = Number(raw);
  return isSupportedChainId(parsed) ? parsed : DEFAULT_CHAIN_ID;
}

export function CryptoNetworkProvider({ children }: { children: ReactNode }) {
  const [selectedChainId, setSelectedChainIdState] = useState(readStoredChainId);

  const setSelectedChainId = useCallback((chainId: number) => {
    if (!isSupportedChainId(chainId)) return;
    setSelectedChainIdState(chainId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(chainId));
    }
  }, []);

  const selectedChain = getChain(selectedChainId) ?? SUPPORTED_CHAINS[0];

  const value = useMemo(
    () => ({
      selectedChainId,
      selectedChain,
      setSelectedChainId,
      supportedChains: SUPPORTED_CHAINS,
    }),
    [selectedChain, selectedChainId, setSelectedChainId],
  );

  return (
    <CryptoNetworkContext.Provider value={value}>{children}</CryptoNetworkContext.Provider>
  );
}

export function useCryptoNetwork() {
  const ctx = useContext(CryptoNetworkContext);
  if (!ctx) {
    throw new Error("useCryptoNetwork must be used within CryptoNetworkProvider");
  }
  return ctx;
}
