import { STATUS_LABELS } from "@/lib/status";
import type { PaymentRequestStatus } from "@/types/payment-request";

type ChipVariant = "neutral" | "amber" | "clay";

const VARIANT_BY_STATUS: Partial<Record<PaymentRequestStatus, ChipVariant>> = {
  work_submitted: "amber",
  disputed: "clay",
};

const CHIP_STYLES: Record<ChipVariant, string> = {
  neutral: "bg-accent-tint text-accent ring-1 ring-inset ring-accent-tint-line",
  amber: "bg-amber-tint text-amber",
  clay: "bg-clay-tint text-clay",
};

const DOT_STYLES: Record<ChipVariant, string> = {
  neutral: "bg-accent",
  amber: "bg-amber animate-pulse motion-reduce:animate-none",
  clay: "bg-clay",
};

export function StatusChip({ status }: { status: PaymentRequestStatus }) {
  const variant = VARIANT_BY_STATUS[status] ?? "neutral";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${CHIP_STYLES[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[variant]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
