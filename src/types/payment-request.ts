// Mirrors payment_requests in supabase/migrations/0001_init.sql (SPEC.md §5, §4).
export type PaymentRequestStatus =
  | "draft"
  | "awaiting_payment"
  | "funded"
  | "work_submitted"
  | "approved"
  | "auto_released"
  | "disputed"
  | "resolved_release"
  | "resolved_refund"
  | "paid_out"
  | "refunded";

export const REVIEW_WINDOW_HOURS = [24, 72, 168] as const;
export type ReviewWindowHours = (typeof REVIEW_WINDOW_HOURS)[number];

export interface PaymentRequest {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  amount_cents: number;
  currency: string;
  review_window_hours: ReviewWindowHours;
  status: PaymentRequestStatus;
  stripe_payment_intent_id: string | null;
  funded_at: string | null;
  submitted_at: string | null;
  submission_note: string | null;
  review_deadline: string | null;
  released_at: string | null;
  dispute_reason: string | null;
  created_at: string;
}
