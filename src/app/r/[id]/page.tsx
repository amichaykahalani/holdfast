import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCents } from "@/lib/fee";
import { ActionButton } from "@/components/action-button";
import { ApproveWithConsent } from "@/components/approve-with-consent";
import { CountdownTimer } from "@/components/countdown-timer";
import { StatusChip } from "@/components/status-chip";
import { SiteFooter } from "@/components/site-footer";
import { startCheckout, approveRequest, disputeRequest } from "./actions";
import type { PaymentRequest } from "@/types/payment-request";

export default async function PublicRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paypal_pending?: string }>;
}) {
  const { id } = await params;
  const { paypal_pending: paypalPending } = await searchParams;
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("payment_requests")
    .select(
      "id, title, description, amount_cents, currency, review_window_hours, status, submission_note, submitted_at, review_deadline, dispute_reason",
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
        | "submitted_at"
        | "review_deadline"
        | "dispute_reason"
      >
    >();

  if (!request) notFound();

  const isAwaitingPayment = request.status === "awaiting_payment";
  const isWorkSubmitted = request.status === "work_submitted";
  const isDisputed = request.status === "disputed";

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <div className="mx-auto w-full max-w-lg flex-1 px-6">
        <header className="flex items-center justify-between border-b border-line py-7">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 1.5C10 1.5 4.5 5 4.5 10.5C4.5 14.5 7 17.5 10 18.5C13 17.5 15.5 14.5 15.5 10.5C15.5 5 10 1.5 10 1.5Z"
                stroke="#0b6b54"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M10 6V13" stroke="#0b6b54" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d="M7.5 9L10 6L12.5 9"
                stroke="#0b6b54"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="text-[1.0625rem] font-semibold tracking-tight text-ink">
                Kept
              </span>
              <span dir="ltr" className="text-[0.6875rem] text-ink-muted">
                Your money is{" "}
                <span className="font-semibold text-accent">Kept</span>.
              </span>
            </div>
          </div>
          <span className="text-xs text-ink-muted">מאובטח על ידי PayPal</span>
        </header>

        <main className="pb-20 pt-11">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-ink">
            {request.title}
          </h1>
          {request.description && (
            <p className="mt-2 text-[0.9375rem] text-ink-muted">
              {request.description}
            </p>
          )}

          <div className="mt-7 rounded-[10px] border border-line bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-faint">
                  סכום לתשלום
                </p>
                <div className="font-mono text-[2.5rem] font-medium leading-none tracking-tight tabular-nums text-ink">
                  {formatCents(request.amount_cents, request.currency)}
                </div>
              </div>
              <div className="pt-0.5">
                <StatusChip status={request.status} />
              </div>
            </div>

            <p className="mt-5 border-t border-line pt-[1.1rem] text-[0.8125rem] text-ink-muted">
              מוחזק בנאמנות עד לאישור העבודה על ידיכם, או שחרור אוטומטי{" "}
              {request.review_window_hours} שעות לאחר המסירה.
            </p>

            {isAwaitingPayment ? (
              paypalPending ? (
                <p className="mt-5 rounded-lg bg-accent-tint px-4 py-3 text-sm font-medium text-accent">
                  מאשרים את התשלום… רעננו בעוד כמה שניות.
                </p>
              ) : (
                <ActionButton
                  action={startCheckout.bind(null, request.id)}
                  label="מימון הבקשה"
                  pendingLabel="מפנים ל-PayPal…"
                />
              )
            ) : isWorkSubmitted && request.review_deadline ? (
              <>
                {request.submission_note && (
                  <div className="mt-5 border-t border-line pt-[1.1rem]">
                    <span className="mb-1 block text-sm font-semibold text-ink">
                      נמסר
                    </span>
                    {/^https?:\/\//.test(request.submission_note) ? (
                      <a
                        href={request.submission_note}
                        dir="ltr"
                        className="block break-all text-start text-sm text-accent hover:text-accent-hover"
                      >
                        {request.submission_note}
                      </a>
                    ) : (
                      <p className="text-sm text-ink-muted">
                        {request.submission_note}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <CountdownTimer
                    deadline={request.review_deadline}
                    submittedAt={request.submitted_at ?? undefined}
                    totalHours={request.review_window_hours}
                  />
                </div>

                <ApproveWithConsent
                  action={approveRequest.bind(null, request.id)}
                />

                <form
                  action={disputeRequest.bind(null, request.id)}
                  className="mt-3"
                >
                  <details>
                    <summary className="cursor-pointer text-center text-[0.8125rem] text-ink-muted underline decoration-line underline-offset-2 hover:text-clay">
                      יש בעיה? דווחו על כך במקום
                    </summary>
                    <textarea
                      name="reason"
                      required
                      rows={3}
                      placeholder="מה הבעיה עם העבודה שנמסרה?"
                      className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="mt-2 w-full rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-clay hover:border-clay/40 hover:bg-clay-tint"
                    >
                      סימון כבמחלוקת
                    </button>
                  </details>
                </form>
              </>
            ) : isDisputed ? (
              <div className="mt-5 border-t border-line pt-[1.1rem]">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  בבדיקה על ידי Kept
                </span>
                <p className="text-sm text-ink-muted">
                  הכספים נשארים מוחזקים בזמן שהבעיה נבדקת ידנית.
                </p>
                {request.dispute_reason && (
                  <p className="mt-3 text-sm text-ink-muted">
                    <span className="font-semibold text-ink">ההערה שלכם</span>
                    <br />
                    {request.dispute_reason}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-9 flex flex-col gap-4">
            <div className="flex gap-3.5">
              <div className="mt-0.5 w-0.5 flex-none rounded-full bg-accent-tint-line" />
              <p className="text-[0.8125rem] text-ink-muted">
                <strong className="font-semibold text-ink">
                  הכספים מוחזקים, לא מוצאים.
                </strong>{" "}
                לפרילנסר/ית אין גישה לתשלום עד שתאשרו את העבודה, או עד
                שתקופת הבדיקה תסתיים.
              </p>
            </div>
            <div className="flex gap-3.5">
              <div className="mt-0.5 w-0.5 flex-none rounded-full bg-accent-tint-line" />
              <p className="text-[0.8125rem] text-ink-muted">
                <strong className="font-semibold text-ink">
                  אפשר לדווח על בעיה בכל שלב
                </strong>{" "}
                לפני האישור — זה מקפיא את הכספים לבדיקה ידנית.
              </p>
            </div>
            <div className="flex gap-3.5">
              <div className="mt-0.5 w-0.5 flex-none rounded-full bg-accent-tint-line" />
              <p className="text-[0.8125rem] text-ink-muted">
                <strong className="font-semibold text-ink">
                  PayPal מטפל בכסף.
                </strong>{" "}
                Kept לעולם לא רואה או שומרת את פרטי התשלום שלכם.
              </p>
            </div>
          </div>

          <p className="mt-11 text-center text-xs text-ink-faint">
            תשלומים מאובטחים על ידי PayPal · לא נדרש חשבון
          </p>
          <div className="mt-3 text-center text-xs text-ink-faint">
            <SiteFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
