import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCents } from "@/lib/fee";
import { STATUS_LABELS } from "@/lib/status";
import { ActionButton } from "@/components/action-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { startCheckout, approveRequest } from "./actions";
import type { PaymentRequest } from "@/types/payment-request";

export default async function PublicRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("payment_requests")
    .select(
      "id, title, description, amount_cents, currency, review_window_hours, status, submission_note, review_deadline",
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
        | "submission_note"
        | "review_deadline"
      >
    >();

  if (!request) notFound();

  const isAwaitingPayment = request.status === "awaiting_payment";
  const isWorkSubmitted = request.status === "work_submitted";

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
            sessionId ? (
              <p className="mt-6 rounded-md bg-black/5 px-4 py-3 text-sm font-medium">
                Confirming your payment… refresh in a few seconds.
              </p>
            ) : (
              <ActionButton
                action={startCheckout.bind(null, request.id)}
                label="Fund this request"
                pendingLabel="Redirecting to Stripe…"
              />
            )
          ) : isWorkSubmitted && request.review_deadline ? (
            <div className="mt-6 rounded-md bg-black/5 px-4 py-3">
              <p className="text-sm font-medium">
                Status: {STATUS_LABELS[request.status]}
              </p>
              {request.submission_note && (
                <p className="mt-2 text-sm text-black/70">
                  {request.submission_note}
                </p>
              )}
              <div className="mt-2">
                <CountdownTimer deadline={request.review_deadline} />
              </div>
              <ActionButton
                action={approveRequest.bind(null, request.id)}
                label="Approve & release payment"
                pendingLabel="Releasing…"
              />
            </div>
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
