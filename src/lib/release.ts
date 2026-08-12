import { paypalFetch } from "@/lib/paypal/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFeeCents } from "@/lib/fee";
import type { PaymentRequest } from "@/types/payment-request";

type ReleaseTrigger = "approved" | "auto_released";
type ReleaseResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_eligible"
        | "freelancer_no_payout_email"
        | "payout_request_failed";
    };

interface PayPalPayoutResponse {
  batch_header: { payout_batch_id: string; batch_status: string };
}

// Shared by the client's Approve action and the cron sweep (SPEC.md §7) —
// this function IS the idempotency boundary. The conditional single-row
// UPDATE below is atomic/row-locked in Postgres, so it doubles as both the
// "is this still work_submitted" check and the claim, in one step: whichever
// caller's UPDATE actually matches wins, the other sees zero rows back.
//
// Unlike a Stripe Transfer, a PayPal Payout only tells us PENDING here —
// the real outcome arrives later via webhook (see
// src/app/api/webhooks/paypal/route.ts), which is what actually writes
// `paid_out`. `ok: true` from this function means "payout requested",
// not "money has moved".
export async function releaseFunds(
  requestId: string,
  trigger: ReleaseTrigger,
): Promise<ReleaseResult> {
  const admin = createAdminClient();

  const { data: claimed } = await admin
    .from("payment_requests")
    .update({ status: trigger })
    .eq("id", requestId)
    .eq("status", "work_submitted")
    .select("*")
    .maybeSingle<PaymentRequest>();

  if (!claimed) return { ok: false, reason: "not_eligible" };

  // Log before calling PayPal (§7).
  await admin.from("escrow_events").insert({
    payment_request_id: requestId,
    event_type: trigger,
  });

  const { data: freelancer } = await admin
    .from("freelancers")
    .select("paypal_email")
    .eq("id", claimed.freelancer_id)
    .single();

  if (!freelancer?.paypal_email) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "release_blocked",
      metadata: { reason: "freelancer_no_payout_email" },
    });
    return { ok: false, reason: "freelancer_no_payout_email" };
  }

  const feeCents = platformFeeCents(claimed.amount_cents);
  const payoutAmount = claimed.amount_cents - feeCents;

  try {
    const payout = await paypalFetch<PayPalPayoutResponse>(
      "/v1/payments/payouts",
      {
        method: "POST",
        // Deterministic per request — doubles as an idempotency key on
        // PayPal's side too, in case this ever runs twice.
        headers: { "PayPal-Request-Id": `payout-${requestId}` },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: requestId,
            email_subject: "You've been paid via Holdfast",
          },
          items: [
            {
              recipient_type: "EMAIL",
              receiver: freelancer.paypal_email,
              sender_item_id: requestId,
              note: "Payment released via Holdfast",
              amount: {
                value: (payoutAmount / 100).toFixed(2),
                currency: claimed.currency.toUpperCase(),
              },
            },
          ],
        }),
      },
    );

    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "payout_requested",
      metadata: {
        payout_batch_id: payout.batch_header.payout_batch_id,
        amount_cents: payoutAmount,
        fee_cents: feeCents,
      },
    });

    return { ok: true };
  } catch (err) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "release_failed",
      metadata: { error: err instanceof Error ? err.message : String(err) },
    });
    return { ok: false, reason: "payout_request_failed" };
  }
}
