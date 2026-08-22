// Platform amounts are stored as credits (1 credit = K 1), matching the customer app.
const USD_TO_MMK = 1;

/** Format a platform credit amount as Kyat (K). */
export const fmtKyat = (n: number, digits = 0) =>
  `K ${(n * USD_TO_MMK).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtKyatCompact = (n: number) =>
  `K ${Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n * USD_TO_MMK)}`;

/** Format amounts already stored in platform credits (vKs). */
export const fmtVks = (n: number, digits = 0) =>
  `${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })} vKs`;

// Legacy aliases so all callsites just work
export const fmtUsd = fmtKyat;
export const fmtCompact = fmtKyatCompact;

export const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

export const fmtDate = (iso: string, locale = "en") =>
  new Date(iso).toLocaleDateString(locale === "my" ? "my-MM" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
