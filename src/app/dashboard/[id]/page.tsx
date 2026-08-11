import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/base-url";
import { formatCents, platformFeeCents } from "@/lib/fee";
import { STATUS_LABELS } from "@/lib/status";
import { CopyLink } from "@/components/copy-link";
import { CountdownTimer } from "@/components/countdown-timer";
import { markSubmitted } from "./actions";
import type { PaymentRequest } from "@/types/payment-request";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle<PaymentRequest>();

  if (!request) notFound();

  const baseUrl = await getBaseUrl();
  const shareUrl = `${baseUrl}/r/${request.id}`;
  const feeCents = platformFeeCents(request.amount_cents);

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{request.title}</h1>
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium">
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      {request.description && (
        <p className="mt-3 text-sm text-black/70">{request.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-black/60">Amount</dt>
        <dd>{formatCents(request.amount_cents, request.currency)}</dd>
        <dt className="text-black/60">Platform fee</dt>
        <dd>{formatCents(feeCents, request.currency)}</dd>
        <dt className="text-black/60">You receive</dt>
        <dd>
          {formatCents(request.amount_cents - feeCents, request.currency)}
        </dd>
        <dt className="text-black/60">Review window</dt>
        <dd>{request.review_window_hours}h</dd>
      </dl>

      <div className="mt-8">
        <p className="text-sm font-medium">Shareable link</p>
        <p className="mt-1 text-xs text-black/60">
          Send this to your client — no account needed on their end.
        </p>
        <div className="mt-2">
          <CopyLink url={shareUrl} />
        </div>
      </div>

      {request.status === "funded" && (
        <form
          action={markSubmitted.bind(null, request.id)}
          className="mt-8 border-t border-black/10 pt-6"
        >
          <p className="text-sm font-medium">Mark work as submitted</p>
          <p className="mt-1 text-xs text-black/60">
            Starts the {request.review_window_hours}h review countdown.
            Optionally attach a link or note for your client.
          </p>
          <textarea
            name="submission_note"
            rows={3}
            placeholder="e.g. https://your-delivery-link.com"
            className="mt-3 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="mt-3 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
          >
            Mark as submitted
          </button>
        </form>
      )}

      {request.status === "work_submitted" && request.review_deadline && (
        <div className="mt-8 border-t border-black/10 pt-6">
          <p className="text-sm font-medium">Review in progress</p>
          {request.submission_note && (
            <p className="mt-2 text-sm text-black/70">
              {request.submission_note}
            </p>
          )}
          <div className="mt-2">
            <CountdownTimer deadline={request.review_deadline} />
          </div>
        </div>
      )}
    </div>
  );
}
