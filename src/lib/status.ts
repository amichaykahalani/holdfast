import type { PaymentRequestStatus } from "@/types/payment-request";

export const STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  funded: "Funded",
  work_submitted: "In review",
  approved: "Approved",
  auto_released: "Auto-released",
  disputed: "Disputed",
  resolved_release: "Resolved — released",
  resolved_refund: "Resolved — refunded",
  paid_out: "Paid out",
  refunded: "Refunded",
};
