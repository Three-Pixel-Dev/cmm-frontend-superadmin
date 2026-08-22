import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "full" | "icon";
  className?: string;
  subtitle?: string;
};

export function BrandLogo({ variant = "full", className, subtitle }: BrandLogoProps) {
  if (variant === "icon") {
    return (
      <img
        src="/logo-icon.png"
        alt="SuperCash"
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <img
        src="/logo.png"
        alt="SuperCash — Predict more, Win more"
        className="h-9 w-auto max-w-[170px] object-contain object-left"
      />
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
