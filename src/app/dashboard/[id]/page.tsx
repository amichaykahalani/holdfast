import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/base-url";
import { formatCents, platformFeeCents } from "@/lib/fee";
import { STATUS_LABELS } from "@/lib/status";
import { CopyLink } from "@/components/copy-link";
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
    </div>
  );
}
