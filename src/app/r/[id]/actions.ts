"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { paypalFetch } from "@/lib/paypal/client";
import { getBaseUrl } from "@/lib/base-url";
import { releaseFunds } from "@/lib/release";
import { RELEASE_CONSENT_TEXT } from "@/lib/consent";
import type { ActionState } from "@/components/action-button";
import type { PaymentRequest } from "@/types/payment-request";

interface PayPalOrder {
  id: string;
  links: { rel: string; href: string }[];
}

export async function startCheckout(requestId: string): Promise<ActionState> {
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("payment_requests")
    .select("id, title, amount_cents, currency, status")
    .eq("id", requestId)
    .maybeSingle<
      Pick<PaymentRequest, "id" | "title" | "amount_cents" | "currency" | "status">
    >();

  if (!request) return { error: "הבקשה לא נמצאה." };
  if (request.status !== "awaiting_payment") {
    return { error: "הבקשה כבר אינה ממתינה לתשלום." };
  }

  const baseUrl = await getBaseUrl();
  const returnUrl = `${baseUrl}/r/${request.id}`;

  let approveUrl: string | undefined;
  try {
    const order = await paypalFetch<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": `order-${request.id}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: request.id,
            description: request.title.slice(0, 127),
            amount: {
              currency_code: request.currency.toUpperCase(),
              value: (request.amount_cents / 100).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Holdfast",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${baseUrl}/r/${request.id}/paypal-return`,
          cancel_url: returnUrl,
        },
      }),
    });
    approveUrl = order.links.find((link) => link.rel === "approve")?.href;
  } catch (err) {
    console.error("startCheckout: PayPal order creation failed:", err);
    return { error: "משהו השתבש בתחילת התשלום. נסו שוב." };
  }

  if (!approveUrl) return { error: "PayPal לא החזיר קישור לאישור תשלום." };

  redirect(approveUrl);
}

export async function approveRequest(
  requestId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const consentText = String(formData.get("consent_text") ?? "");
  if (consentText !== RELEASE_CONSENT_TEXT) {
    return { error: "יש לאשר את התנאים לפני שחרור התשלום." };
  }

  const admin = createAdminClient();
  await admin.from("escrow_events").insert({
    payment_request_id: requestId,
    event_type: "client_release_consent",
    metadata: { consent_text: consentText },
  });

  const result = await releaseFunds(requestId, "approved");

  if (!result.ok) {
    if (result.reason === "freelancer_no_payout_email") {
      return {
        error: "הפרילנסר/ית עדיין לא הוסיפו אימייל תשלום ב-PayPal. נסו שוב מאוחר יותר.",
      };
    }
    if (result.reason === "payout_request_failed") {
      return { error: "משהו השתבש בשחרור התשלום. נסו שוב." };
    }
    // "not_eligible" — already handled (e.g. a double-click); fall through
    // to the redirect below so the page just reflects current status.
  }

  redirect(`/r/${requestId}`);
}

export async function disputeRequest(requestId: string, formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("נא לתאר את הבעיה.");

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
