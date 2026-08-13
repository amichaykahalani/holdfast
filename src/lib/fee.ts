// SPEC.md §7: platform fee = 1% of the amount (introductory launch rate,
// down from 3.5%), minimum ₪10.00 (1000 agorot).
export function platformFeeCents(amountCents: number): number {
  return Math.max(Math.round(amountCents * 0.01), 1000);
}

export function formatCents(cents: number, currency = "ils"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
