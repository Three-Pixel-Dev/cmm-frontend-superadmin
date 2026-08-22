import { createConfig, http, type Config } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { getWagmiChains, SUPPORTED_CHAINS } from "@/lib/web3/chains";
import {
  getWalletConnectMetadata,
  getWalletConnectProjectId,
} from "@/lib/web3/walletConnect";

export { getChain, SUPPORTED_CHAINS } from "@/lib/web3/chains";

export const erc20TransferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function buildTransports() {
  const transports: Record<number, ReturnType<typeof http>> = {};
  for (const chain of SUPPORTED_CHAINS) {
    transports[chain.id] = http(chain.rpcUrl);
  }
  return transports;
}

function buildConfig(): Config {
  const chains = getWagmiChains();
  const projectId = getWalletConnectProjectId();
  if (!projectId) {
    return createConfig({
      chains,
      connectors: [],
      ssr: true,
      transports: buildTransports(),
    });
  }

  return createConfig({
    chains,
    connectors: [
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: getWalletConnectMetadata(),
      }),
    ],
    ssr: true,
    transports: buildTransports(),
  });
}

let wagmiConfigSingleton: Config | undefined;

export function getWagmiConfig(force = false): Config {
  if (force || !wagmiConfigSingleton) {
    wagmiConfigSingleton = buildConfig();
  }
  return wagmiConfigSingleton;
}
