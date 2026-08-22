export function getWalletConnectProjectId(): string | undefined {
  const id = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();
  return id || undefined;
}

export function isWalletConnectEnabled(): boolean {
  return Boolean(getWalletConnectProjectId());
}

export function getWalletConnectMetadata() {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://cmm.local";
  return {
    name: "SuperCash Admin",
    description: "SuperCash Platform Administration",
    url: origin,
    icons: [`${origin}/favicon.png`],
  };
}
