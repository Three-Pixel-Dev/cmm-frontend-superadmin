import { useCryptoNetwork } from "@/components/providers/CryptoNetworkProvider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getChain, type SupportedChain } from "@/lib/web3/chains";
import { cn } from "@/lib/utils";

type NetworkPickerProps = {
  className?: string;
  /** Restrict choices (e.g. agent receive networks). Defaults to all supported chains. */
  chains?: SupportedChain[];
  value?: number;
  onValueChange?: (chainId: number) => void;
  disabled?: boolean;
  helperId?: string;
  statusId?: string;
  label?: string;
  helperText?: string;
};

export function NetworkPicker({
  className,
  chains: chainsProp,
  value,
  onValueChange,
  disabled = false,
  helperId = "crypto-network-helper",
  statusId = "crypto-network-status",
  label = "Network",
  helperText = "Choose the blockchain network for this USDT wallet or transfer.",
}: NetworkPickerProps) {
  const { selectedChainId, setSelectedChainId, supportedChains } = useCryptoNetwork();
  const chains = chainsProp ?? supportedChains;
  const currentId = value ?? selectedChainId;
  const currentChain = getChain(currentId) ?? chains[0];

  const handleChange = (next: string) => {
    const chainId = Number(next);
    if (Number.isNaN(chainId)) return;
    if (onValueChange) {
      onValueChange(chainId);
    } else {
      setSelectedChainId(chainId);
    }
  };

  const singleChain = chains.length <= 1;

  return (
    <fieldset className={cn("space-y-3", className)} disabled={disabled}>
      <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </legend>
      <p id={helperId} className="text-sm text-muted-foreground">
        {helperText}
      </p>
      <RadioGroup
        value={String(currentId)}
        onValueChange={handleChange}
        className="grid gap-2 sm:grid-cols-2"
        aria-describedby={`${helperId} ${statusId}`}
        aria-label={label}
      >
        {chains.map((chain) => (
          <div
            key={chain.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              currentId === chain.id ? "border-primary bg-primary/5" : "border-border",
              singleChain && "opacity-80",
            )}
          >
            <RadioGroupItem
              value={String(chain.id)}
              id={`network-${chain.id}`}
              disabled={disabled || singleChain}
              aria-label={`${chain.name} (${chain.shortName})`}
            />
            <Label htmlFor={`network-${chain.id}`} className="cursor-pointer space-y-0.5 font-normal">
              <span className="block text-sm font-medium">{chain.name}</span>
              <span className="block text-xs text-muted-foreground">{chain.shortName}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      <p id={statusId} className="text-sm text-muted-foreground" aria-live="polite">
        Selected network: {currentChain.name}. Wallet must be connected on this network to send
        USDT.
      </p>
    </fieldset>
  );
}
