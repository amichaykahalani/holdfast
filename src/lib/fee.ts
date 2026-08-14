// SPEC.md §7: platform fee = 1% of the amount (introductory launch rate,
// down from 3.5%), minimum ₪10.00 (1000 agorot).
export function platformFeeCents(amountCents: number): number {
  return Math.max(Math.round(amountCents * 0.01), 1000);
}

export function formatCents(cents: number, currency = "ils"): string {
  // he-IL, not en-US: puts the ₪ symbol after the number ("2,000.00 ₪"),
  // which is how it actually reads in Hebrew — en-US would put it first.
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
