const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export function normalizeCustomerId(id: string): string {
  return id.replace(/\D/g, "");
}

export function microsToUnits(micros: number | string | undefined): number {
  const n = Number(micros ?? 0);
  return n / 1_000_000;
}

export function formatMoney(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode + " ";
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function gaqlDateRange(days: number): string {
  if (days === 7) return "LAST_7_DAYS";
  if (days === 90) return "LAST_90_DAYS";
  return "LAST_30_DAYS";
}
