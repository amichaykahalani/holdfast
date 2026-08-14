import type { PaymentRequestStatus } from "@/types/payment-request";

export const STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  draft: "טיוטה",
  awaiting_payment: "ממתין לתשלום",
  funded: "מומן",
  work_submitted: "בבדיקה",
  approved: "אושר",
  auto_released: "שוחרר אוטומטית",
  disputed: "במחלוקת",
  resolved_release: "טופל — שוחרר",
  resolved_refund: "טופל — הוחזר",
  paid_out: "שולם",
  refunded: "הוחזר",
};
