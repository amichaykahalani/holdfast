import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFeeCents } from "@/lib/fee";
import type { PaymentRequest } from "@/types/payment-request";

type ReleaseTrigger = "approved" | "auto_released";
type ReleaseResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_eligible" | "freelancer_not_onboarded" | "transfer_failed";
    };

// Shared by the client's Approve action and the cron sweep (SPEC.md §7) —
// this function IS the idempotency boundary. The conditional single-row
// UPDATE below is atomic/row-locked in Postgres, so it doubles as both the
// "is this still work_submitted" check and the claim, in one step: whichever
// caller's UPDATE actually matches wins, the other sees zero rows back.
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

  // Log before calling Stripe (§7).
  await admin.from("escrow_events").insert({
    payment_request_id: requestId,
    event_type: trigger,
  });

  const { data: freelancer } = await admin
    .from("freelancers")
    .select("stripe_connected_account_id, stripe_onboarding_complete")
    .eq("id", claimed.freelancer_id)
    .single();

  if (
    !freelancer?.stripe_onboarding_complete ||
    !freelancer.stripe_connected_account_id
  ) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "release_blocked",
      metadata: { reason: "freelancer_not_onboarded" },
    });
    return { ok: false, reason: "freelancer_not_onboarded" };
  }

  const feeCents = platformFeeCents(claimed.amount_cents);
  const transferAmount = claimed.amount_cents - feeCents;

  try {
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: claimed.currency,
      destination: freelancer.stripe_connected_account_id,
      metadata: { payment_request_id: requestId },
    });

    await admin
      .from("payment_requests")
      .update({ status: "paid_out", released_at: new Date().toISOString() })
      .eq("id", requestId);

    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "paid_out",
      metadata: {
        transfer_id: transfer.id,
        amount_cents: transferAmount,
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
    return { ok: false, reason: "transfer_failed" };
  }
}
