import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCents } from "@/lib/fee";
import { STATUS_LABELS } from "@/lib/status";
import type { PaymentRequest } from "@/types/payment-request";

export default async function PublicRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("payment_requests")
    .select(
      "id, title, description, amount_cents, currency, review_window_hours, status",
    )
    .eq("id", id)
    .maybeSingle<
      Pick<
        PaymentRequest,
        | "id"
        | "title"
        | "description"
        | "amount_cents"
        | "currency"
        | "review_window_hours"
        | "status"
      >
    >();

  if (!request) notFound();

  const isAwaitingPayment = request.status === "awaiting_payment";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10">
        <div className="mx-auto max-w-lg px-6 py-4 text-lg font-semibold">
          Holdfast
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16">
        <h1 className="text-2xl font-semibold">{request.title}</h1>
        {request.description && (
          <p className="mt-3 text-black/70">{request.description}</p>
        )}

        <div className="mt-8 rounded-lg border border-black/10 p-6">
          <p className="text-sm text-black/60">Amount due</p>
          <p className="text-3xl font-bold">
            {formatCents(request.amount_cents, request.currency)}
          </p>
          <p className="mt-1 text-xs text-black/50">
            Held in escrow until you approve the work, or released
            automatically {request.review_window_hours}h after it&apos;s
            submitted.
          </p>

          {isAwaitingPayment ? (
            <button
              type="button"
              disabled
              title="Payment is coming in the next build slice"
              className="mt-6 w-full rounded-md bg-black px-4 py-3 font-medium text-white opacity-50"
            >
              Fund this request
            </button>
          ) : (
            <p className="mt-6 rounded-md bg-black/5 px-4 py-3 text-sm font-medium">
              Status: {STATUS_LABELS[request.status]}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-black/40">
          Payments secured by Stripe · No account required
        </p>
      </main>
    </div>
  );
}
