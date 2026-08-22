import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/base-url";
import { formatCents, platformFeeCents } from "@/lib/fee";
import { StatusChip } from "@/components/status-chip";
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
        <h1 className="text-xl font-semibold text-ink">{request.title}</h1>
        <StatusChip status={request.status} />
      </div>

      {request.description && (
        <p className="mt-3 text-sm text-ink-muted">{request.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm font-mono tabular-nums">
        <dt className="font-sans text-ink-muted">סכום</dt>
        <dd className="font-medium text-ink">
          {formatCents(request.amount_cents, request.currency)}
        </dd>
        <dt className="font-sans text-ink-muted">עמלת פלטפורמה</dt>
        <dd className="font-medium text-ink">
          {formatCents(feeCents, request.currency)}
        </dd>
        <dt className="font-sans text-ink-muted">תקבלו</dt>
        <dd className="font-medium text-ink">
          {formatCents(request.amount_cents - feeCents, request.currency)}
        </dd>
        <dt className="font-sans text-ink-muted">תקופת בדיקה</dt>
        <dd className="font-sans font-medium text-ink">
          {request.review_window_hours} שעות
        </dd>
      </dl>

      <div className="mt-8">
        <p className="text-sm font-medium text-ink">קישור לשיתוף</p>
        <p className="mt-1 text-xs text-ink-muted">
          שלחו את זה ללקוח — לא נדרש חשבון מהצד שלו.
        </p>
        <div className="mt-2">
          <CopyLink url={shareUrl} />
        </div>
      </div>

      {request.status === "funded" && (
        <form
          action={markSubmitted.bind(null, request.id)}
          className="mt-8 border-t border-line pt-6"
        >
          <p className="text-sm font-medium text-ink">סימון עבודה כנמסרה</p>
          <p className="mt-1 text-xs text-ink-muted">
            מתחיל את ספירת הבדיקה של {request.review_window_hours} שעות. אפשר
            לצרף קישור או הערה עבור הלקוח.
          </p>
          <textarea
            name="submission_note"
            rows={3}
            placeholder="למשל https://your-delivery-link.com"
            className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            סימון כנמסר
          </button>
        </form>
      )}

      {request.status === "work_submitted" && request.review_deadline && (
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-sm font-medium text-ink">בבדיקה</p>
          {request.submission_note && (
            <p className="mt-2 text-sm text-ink-muted">
              {request.submission_note}
            </p>
          )}
          <div className="mt-2">
            <CountdownTimer
              deadline={request.review_deadline}
              submittedAt={request.submitted_at ?? undefined}
              totalHours={request.review_window_hours}
            />
          </div>
        </div>
      )}

      {request.status === "disputed" && (
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-sm font-medium text-ink">
            במחלוקת — הוקפא לבדיקה ידנית
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            הלקוח דיווח על בעיה. הכספים יישארו מוחזקים עד לפתרון ידני.
          </p>
          {request.dispute_reason && (
            <p className="mt-2 text-sm text-ink-muted">
              {request.dispute_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
