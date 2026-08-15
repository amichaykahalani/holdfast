// SPEC.md §7: platform fee = 1% of the amount, with a tiered minimum that
// scales with the request size instead of one flat floor:
//   < ₪100        -> ₪1 minimum
//   ₪100 - ₪500    -> ₪3 minimum
//   ₪500 - ₪1000   -> ₪7 minimum
//   > ₪1000       -> no minimum, just 1%
// Each tier's ceiling is exactly where 1% overtakes that tier's minimum
// (₪300 and ₪700), so the fee curve has no discontinuity at those points.
export function platformFeeCents(amountCents: number): number {
  const raw = Math.round(amountCents * 0.01);
  if (amountCents > 100_000) return raw;

  const minimumCents =
    amountCents < 10_000 ? 100 : amountCents < 50_000 ? 300 : 700;
  return Math.max(raw, minimumCents);
}

export function formatCents(cents: number, currency = "ils"): string {
  // he-IL, not en-US: puts the ₪ symbol after the number ("2,000.00 ₪"),
  // which is how it actually reads in Hebrew — en-US would put it first.
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
