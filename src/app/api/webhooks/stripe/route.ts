import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

// SPEC.md §7: all state transitions must be driven by Stripe webhook events,
// never trusting the client-side Checkout redirect alone.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.payment_request_id;
  if (!requestId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const admin = createAdminClient();

  // Conditioned on the current status so retried/duplicate webhook
  // deliveries are a no-op after the first successful transition (§7).
  const { data: updated } = await admin
    .from("payment_requests")
    .update({
      status: "funded",
      funded_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", requestId)
    .eq("status", "awaiting_payment")
    .select("id");

  if (updated && updated.length > 0) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "funded",
      metadata: session as unknown as Record<string, unknown>,
    });
  }
}
