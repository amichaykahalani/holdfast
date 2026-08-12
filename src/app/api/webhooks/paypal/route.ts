import { NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal/client";
import { createAdminClient } from "@/lib/supabase/admin";

// SPEC.md §7: all state transitions must be driven by provider webhook
// events, never trusting the client-side redirect alone. PayPal signature
// verification is a live API call (unlike Stripe's local HMAC check) —
// see https://developer.paypal.com/api/rest/webhooks/rest/#link-verifyeventsignature.
export async function POST(request: Request) {
  const body = await request.text();
  const event = JSON.parse(body);

  const verification = await paypalFetch<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: request.headers.get("paypal-auth-algo"),
        cert_url: request.headers.get("paypal-cert-url"),
        transmission_id: request.headers.get("paypal-transmission-id"),
        transmission_sig: request.headers.get("paypal-transmission-sig"),
        transmission_time: request.headers.get("paypal-transmission-time"),
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      }),
    },
  ).catch((err) => {
    console.error("PayPal webhook verification request failed:", err);
    return null;
  });

  if (!verification || verification.verification_status !== "SUCCESS") {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      await handleCaptureCompleted(event.resource);
      break;
    case "PAYMENTS.PAYOUTS-ITEM.SUCCEEDED":
      await handlePayoutSucceeded(event.resource);
      break;
    case "PAYMENTS.PAYOUTS-ITEM.FAILED":
    case "PAYMENTS.PAYOUTS-ITEM.RETURNED":
      await handlePayoutFailedOrReturned(event.resource, event.event_type);
      break;
    case "PAYMENTS.PAYOUTS-ITEM.UNCLAIMED":
      await handlePayoutUnclaimed(event.resource);
      break;
  }

  return NextResponse.json({ received: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCaptureCompleted(resource: any) {
  const requestId: string | undefined = resource.custom_id;
  if (!requestId) return;

  const orderId: string =
    resource.supplementary_data?.related_ids?.order_id ?? resource.id;

  const admin = createAdminClient();

  // Conditioned on current status, same idempotency pattern as everywhere
  // else — a redelivered webhook is a no-op after the first success.
  const { data: updated } = await admin
    .from("payment_requests")
    .update({
      status: "funded",
      funded_at: new Date().toISOString(),
      paypal_order_id: orderId,
    })
    .eq("id", requestId)
    .eq("status", "awaiting_payment")
    .select("id");

  if (updated && updated.length > 0) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "funded",
      metadata: resource,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePayoutSucceeded(resource: any) {
  const requestId: string | undefined = resource.payout_item?.sender_item_id;
  if (!requestId) return;

  const admin = createAdminClient();

  const { data: updated } = await admin
    .from("payment_requests")
    .update({
      status: "paid_out",
      released_at: new Date().toISOString(),
      paypal_payout_item_id: resource.payout_item_id ?? null,
    })
    .eq("id", requestId)
    .in("status", ["approved", "auto_released"])
    .select("id");

  if (updated && updated.length > 0) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "paid_out",
      metadata: resource,
    });
  }
}

async function handlePayoutFailedOrReturned(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resource: any,
  eventType: string,
) {
  const requestId: string | undefined = resource.payout_item?.sender_item_id;
  if (!requestId) return;

  // No status transition here — the row stays at approved/auto_released
  // for manual follow-up, same posture as any other release failure.
  const admin = createAdminClient();
  await admin.from("escrow_events").insert({
    payment_request_id: requestId,
    event_type: "release_failed",
    metadata: { paypal_event_type: eventType, ...resource },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePayoutUnclaimed(resource: any) {
  const requestId: string | undefined = resource.payout_item?.sender_item_id;
  if (!requestId) return;

  // PayPal lets you pay an email that isn't a PayPal account yet — the
  // recipient has 30 days to sign up and claim it before it auto-returns.
  // Log-only; no status change.
  const admin = createAdminClient();
  await admin.from("escrow_events").insert({
    payment_request_id: requestId,
    event_type: "payout_unclaimed",
    metadata: resource,
  });
}
