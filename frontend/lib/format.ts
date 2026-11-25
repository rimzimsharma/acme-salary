export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDeviation(percent: number): string {
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}
