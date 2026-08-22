import { bsc, mainnet } from "wagmi/chains";

export type SupportedChain = {
  id: number;
  name: string;
  shortName: string;
  usdtAddress: `0x${string}`;
  usdtDecimals: number;
  rpcUrl: string;
  explorerTxUrl: (hash: string) => string;
};

const BSC_USDT =
  (import.meta.env.VITE_BSC_USDT_ADDRESS as string | undefined) ??
  "0x55d398326f99059fF775485246999027B3197955";

const ETH_USDT =
  (import.meta.env.VITE_ETHEREUM_USDT_ADDRESS as string | undefined) ??
  "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const BSC_RPC =
  (import.meta.env.VITE_BSC_RPC_URL as string | undefined) ?? "https://bsc-dataseed.binance.org";

const ETH_RPC =
  (import.meta.env.VITE_ETHEREUM_RPC_URL as string | undefined) ??
  "https://ethereum.publicnode.com";

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    id: bsc.id,
    name: bsc.name,
    shortName: "BSC",
    usdtAddress: BSC_USDT as `0x${string}`,
    usdtDecimals: 18,
    rpcUrl: BSC_RPC,
    explorerTxUrl: (hash) => `https://bscscan.com/tx/${hash}`,
  },
  {
    id: mainnet.id,
    name: mainnet.name,
    shortName: "Ethereum",
    usdtAddress: ETH_USDT as `0x${string}`,
    usdtDecimals: 6,
    rpcUrl: ETH_RPC,
    explorerTxUrl: (hash) => `https://etherscan.io/tx/${hash}`,
  },
];

export const DEFAULT_CHAIN_ID = bsc.id;

const chainById = new Map(SUPPORTED_CHAINS.map((c) => [c.id, c]));

export function getChain(id: number): SupportedChain | undefined {
  return chainById.get(id);
}

export function isSupportedChainId(id: number): boolean {
  return chainById.has(id);
}

export function getSupportedChainIds(): number[] {
  return SUPPORTED_CHAINS.map((c) => c.id);
}

export function getWagmiChains() {
  return SUPPORTED_CHAINS.map((c) => (c.id === bsc.id ? bsc : mainnet));
}
