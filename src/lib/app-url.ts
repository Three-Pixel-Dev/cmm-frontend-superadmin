/** Customer-facing SuperCash app (separate from this admin UI). */
export const CUSTOMER_APP_URL = (
  import.meta.env.VITE_CUSTOMER_APP_URL ?? "http://localhost:5173"
).replace(/\/$/, "");
