// SPEC.md §7: platform fee = 3.5% of the amount, minimum $3.00 (300 cents).
export function platformFeeCents(amountCents: number): number {
  return Math.max(Math.round(amountCents * 0.035), 300);
}

export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
