import { NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal/client";

// PayPal doesn't auto-capture like Stripe Checkout does — this route (the
// application_context.return_url from startCheckout) is what actually
// triggers the capture once the buyer approves on PayPal's site. The DB
// transition to `funded` is still owned by the webhook handler
// (PAYMENT.CAPTURE.COMPLETED), not this redirect — this just moves the
// money and shows a "confirming" state while the webhook catches up.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("token");

  if (orderId) {
    try {
      await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
      });
    } catch {
      // Capture can fail (expired/already-captured/declined order) — fall
      // through to a plain redirect so the page just reflects current
      // status rather than surfacing a raw error here.
    }
  }

  return NextResponse.redirect(`${origin}/r/${id}?paypal_pending=1`);
}
