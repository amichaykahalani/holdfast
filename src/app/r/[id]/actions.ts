"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { getBaseUrl } from "@/lib/base-url";
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
