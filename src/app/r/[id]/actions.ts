"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { getBaseUrl } from "@/lib/base-url";
import { releaseFunds } from "@/lib/release";
import type { PaymentRequest } from "@/types/payment-request";

export async function startCheckout(requestId: string) {
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("payment_requests")
    .select("id, title, amount_cents, currency, status")
    .eq("id", requestId)
    .maybeSingle<
      Pick<PaymentRequest, "id" | "title" | "amount_cents" | "currency" | "status">
    >();

  if (!request) throw new Error("Request not found.");
  if (request.status !== "awaiting_payment") {
    throw new Error("This request is no longer awaiting payment.");
  }

  const baseUrl = await getBaseUrl();
  const returnUrl = `${baseUrl}/r/${request.id}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: request.currency,
          unit_amount: request.amount_cents,
          product_data: { name: request.title },
        },
      },
    ],
    metadata: { payment_request_id: request.id },
    payment_intent_data: {
      metadata: { payment_request_id: request.id },
    },
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  redirect(session.url);
}

export async function approveRequest(requestId: string) {
  const result = await releaseFunds(requestId, "approved");

  if (!result.ok) {
    if (result.reason === "freelancer_not_onboarded") {
      throw new Error(
        "The freelancer hasn't finished connecting their payout account yet. Please try again later.",
      );
    }
    if (result.reason === "transfer_failed") {
      throw new Error("Something went wrong releasing the payment. Please try again.");
    }
    // "not_eligible" — already handled (e.g. a double-click); fall through
    // to the redirect below so the page just reflects current status.
  }

  redirect(`/r/${requestId}`);
}

export async function disputeRequest(requestId: string, formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Please describe the issue.");

  const admin = createAdminClient();

  // Same atomic-claim idempotency pattern as releaseFunds — a conditional
  // UPDATE...WHERE status = 'work_submitted' both checks and claims in one
  // step. Zero rows back means it's already past this state (e.g. a
  // double-submit, or it was just approved/auto-released) — silent no-op.
  const { data: claimed } = await admin
    .from("payment_requests")
    .update({ status: "disputed", dispute_reason: reason })
    .eq("id", requestId)
    .eq("status", "work_submitted")
    .select("id");

  if (claimed && claimed.length > 0) {
    await admin.from("escrow_events").insert({
      payment_request_id: requestId,
      event_type: "disputed",
      metadata: { reason },
    });
  }

  redirect(`/r/${requestId}`);
}
