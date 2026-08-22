const LEGACY_PAYMENT_LABELS: Record<string, string> = {
  kpay: "Kpay",
  wave: "Wave",
  kbz_pay: "KBZ Pay",
  cb_pay: "CB Pay",
  aya_pay: "AYA Pay",
  yoma_pay: "Yoma Pay",
};

export function paymentMethodLabel(
  value: string | undefined,
  types?: { id: string; name: string }[],
): string {
  if (!value) return "—";
  const match = types?.find((t) => t.id === value);
  if (match) return match.name;
  return LEGACY_PAYMENT_LABELS[value] ?? value;
}

export function paymentMethodsLabel(
  values: string[] | undefined,
  types?: { id: string; name: string }[],
): string {
  if (!values?.length) return "—";
  return values.map((v) => paymentMethodLabel(v, types)).join(", ");
}

export function incomePreferenceLabel(value: string | undefined): string {
  if (value === "spread_only") return "Spread income only";
  if (value === "spread_and_affiliate") return "Spread + affiliate income";
  return value || "—";
}
