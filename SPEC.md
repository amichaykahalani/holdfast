# Kept — Product & Technical Specification

> This is the source of truth for building Kept. Treat every detail here as a firm requirement unless explicitly marked "future / v2". When in doubt, favor the simplest implementation that satisfies the requirement.

---

## 1. Product Overview

**Kept** is a low-friction escrow platform for independent freelancers (designers, developers, consultants) and their direct clients.

### Problem
1. Freelancers waste time chasing unpaid invoices and risk non-payment after delivering work.
2. Clients hesitate to pay 100% upfront, fearing poor quality or ghosting.
3. Traditional legal contracts or manual bank escrow are too slow, expensive, and bureaucratic for small/medium freelance milestones.

### Solution
An automated escrow flow:
1. Freelancer creates a payment request (title, scope, amount, auto-release review window).
2. Client opens a link and funds it (money is locked — not accessible to client, not yet paid to freelancer).
3. Freelancer marks work as submitted → review countdown starts.
4. Funds release to freelancer when client clicks "Approve" **or** automatically when the timer hits zero.
5. If client raises a dispute, the timer pauses, funds stay locked, and the request enters a dispute state.

### Core principle for every design decision
Only the **freelancer** has an account. The **client never registers** — they just open a link and pay. Every feature that adds friction for the client should be cut or deferred.

---

## 2. Users & Roles

| Role | Needs account? | What they do |
|---|---|---|
| Freelancer | Yes | Creates requests, adds PayPal payout email, submits work, resolves disputes |
| Client | No | Opens a link, pays, approves or disputes — no login required |
| Admin (you) | Manual/internal only | Reviews disputes via Supabase Studio or a minimal internal view — **no admin UI in v1** |

---

## 3. Scope for v1 (MVP) — Build ONLY This

✅ In scope:
- Freelancer signup/login + PayPal payout email on file
- Create a payment request (title, description, amount, review window: 24h / 3 days / 7 days)
- Shareable public link per request
- Client funds the request via PayPal (Orders API — card or PayPal balance), no account needed
- Freelancer marks work as "submitted" (optional link/note attached)
- Countdown timer starts on submission
- Client can "Approve" (manual release) or do nothing (auto-release at timer expiry)
- Client can flag "Dispute" — freezes timer, funds stay locked, status becomes `disputed`
- Email notifications at each key state change
- Platform fee: 1% of transaction amount (introductory launch rate), with a tiered minimum that scales with request size (see §7), deducted from freelancer payout, shown transparently before request creation
- Minimum request amount: ₪20, enforced at creation

❌ Explicitly OUT of scope for v1 (do not build):
- Multi-milestone projects
- In-app chat/messaging
- Admin dashboard UI (use Supabase Studio / direct DB queries manually)
- Mobile app
- Any dispute *resolution* automation — v1 dispute handling is just "freeze + flag for manual review," resolved by the founder manually via email/Slack
- Payment methods outside PayPal's own checkout (e.g., direct bank transfer) — PayPal Orders/Payouts only

---

## 4. Core Status Machine

This is the heart of the product. Every request moves through these states:

```
draft
  → awaiting_payment   (link created, waiting for client to fund)
  → funded             (client paid, funds held on platform)
  → work_submitted     (freelancer marked work as done, countdown running)
  → approved           (client clicked approve) ──┐
  → auto_released       (timer expired, no dispute) ─┴─→ paid_out
  → disputed            (client flagged an issue; timer frozen)
       → resolved_release  (admin manually resolves in freelancer's favor) → paid_out
       → resolved_refund   (admin manually resolves in client's favor) → refunded
```

Rules:
- `approved` and `auto_released` both trigger the **same** release function (idempotent — see §7).
- Once `disputed`, the countdown timer must not resume automatically; only a manual admin action moves it out of that state.
- `paid_out` and `refunded` are terminal states.

---

## 5. Data Model

Use Postgres via Supabase.

### `freelancers`
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| email | text, unique | |
| name | text | |
| paypal_email | text, nullable | payout destination for PayPal Payouts; "onboarded" = this is set |
| created_at | timestamptz | |

### `payment_requests`
| column | type | notes |
|---|---|---|
| id | uuid, PK | also used in the public link, e.g. `/r/{id}` |
| freelancer_id | uuid, FK → freelancers | |
| title | text | |
| description | text | |
| amount_cents | integer | store money as integer cents, never floats |
| currency | text, default 'ils' | |
| review_window_hours | integer | 24 / 72 / 168 |
| status | text | one of the status machine values above |
| paypal_order_id | text, nullable | PayPal Order id, set once capture completes |
| paypal_payout_item_id | text, nullable | PayPal Payouts item id, set once the payout succeeds |
| funded_at | timestamptz, nullable | |
| submitted_at | timestamptz, nullable | |
| submission_note | text, nullable | optional link/description freelancer adds on submission |
| review_deadline | timestamptz, nullable | computed: submitted_at + review_window_hours |
| released_at | timestamptz, nullable | |
| dispute_reason | text, nullable | |
| created_at | timestamptz | |

### `escrow_events`
Append-only audit log — never delete or update rows here.
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| payment_request_id | uuid, FK | |
| event_type | text | e.g. `created`, `funded`, `submitted`, `approved`, `auto_released`, `payout_requested`, `disputed`, `resolved_release`, `resolved_refund` |
| metadata | jsonb, nullable | raw PayPal event data, admin notes, etc. |
| created_at | timestamptz | |

---

## 6. Tech Stack

- **Framework:** Next.js (App Router), TypeScript
- **Hosting:** Vercel
- **Database + Auth:** Supabase (Postgres, Auth for freelancers only, Row-Level Security enabled)
- **Payments:** PayPal REST API — Orders API for client funding, Payouts API for freelancer payout (paid to the freelancer's PayPal email, no Connect-style onboarding)
- **Scheduled jobs:** Vercel Cron (or Supabase Cron) — runs every few minutes to check for expired `review_deadline` values and trigger auto-release
- **Email:** Resend (transactional emails)
- **Styling:** Tailwind CSS

---

## 7. PayPal Integration Details

Switched from Stripe (which doesn't support Israeli-registered platform accounts) to PayPal partway through v1 build. Using the **Payouts API** rather than PayPal Commerce Platform/Partner onboarding — no marketplace-style sub-merchant onboarding, no KYC flow on our side at all.

### Account model
- Platform holds funds in its own PayPal Business balance (freelancer is **not** the merchant of record).
- Freelancers do not "onboard" in any KYC sense — they just provide a PayPal email (`freelancers.paypal_email`) that funds get paid out to via the Payouts API. That email doesn't need to already be a PayPal account: PayPal gives an unclaimed recipient 30 days to sign up before the payout auto-returns.

### Payment flow
1. On request funding: create a PayPal **Order** (`POST /v2/checkout/orders`, `intent: CAPTURE`) and redirect the client to the returned `approve` link. PayPal redirects back to our `return_url` with the order token; unlike Stripe Checkout, PayPal does **not** auto-capture — our return route explicitly calls `POST /v2/checkout/orders/{id}/capture` to actually move the client's money into the platform balance.
2. On release (approve or auto-release): create a PayPal **Payout** (`POST /v1/payments/payouts`) to the freelancer's `paypal_email`, amount = `amount_cents - platform_fee`. **This call only returns `PENDING`** — unlike a Stripe Transfer, the real outcome is only known later via webhook (`PAYMENT.PAYOUTS-ITEM.SUCCEEDED` / `FAILED` / `RETURNED` / `UNCLAIMED`). `status` only becomes `paid_out` once the success webhook lands, not synchronously when the payout is requested.
3. Platform fee = 1% of `amount_cents` (introductory launch rate), with a tiered minimum instead of one flat floor: under ₪100 → ₪1 minimum, ₪100–₪500 → ₪3, ₪500–₪1000 → ₪7, above ₪1000 → no minimum, just 1%. See `platformFeeCents` in `src/lib/fee.ts`. Requests below ₪20 are rejected at creation (`createPaymentRequest`).

### Critical requirements
- **All state transitions must be driven by PayPal webhook events** (`PAYMENT.CAPTURE.COMPLETED` for funding, `PAYMENT.PAYOUTS-ITEM.SUCCEEDED`/`FAILED`/`RETURNED` for release), not just client-side redirects. Never trust the browser alone to confirm a payment — the capture-triggering return route only moves money, it does not itself write `funded`.
- **The release function must be idempotent.** Both the "Approve" button and the cron job may call it — guard against double-payout (check `status` is still `work_submitted` via a single conditional `UPDATE` before requesting the payout, and log to `escrow_events` before calling PayPal).
- PayPal signature verification is a **live API call** (`POST /v1/notifications/verify-webhook-signature`), not a local HMAC check like Stripe's — every webhook request costs a round trip to PayPal plus the OAuth2 token needed to make it.
- Use PayPal **Sandbox** exclusively during development. Do not use live credentials until explicitly instructed.
- Store `paypal_order_id` and `paypal_payout_item_id` for traceability.

---

## 8. Cron Job (Auto-Release)

- Runs every 5 minutes.
- Query: all `payment_requests` where `status = 'work_submitted'` and `review_deadline <= now()`.
- For each: call the shared release function with `trigger = 'auto_released'`.
- Log an `escrow_events` row for every run, even if no requests matched (for debugging).

---

## 9. Pages / Routes (v1)

| Route | Auth | Purpose |
|---|---|---|
| `/` | Public | Marketing/landing page explaining Kept |
| `/signup`, `/login` | Public | Freelancer auth |
| `/settings/payout` | Freelancer | Set the PayPal email that released funds are paid out to |
| `/dashboard` | Freelancer | List of their payment requests + statuses |
| `/dashboard/new` | Freelancer | Create a new payment request |
| `/dashboard/[id]` | Freelancer | Request detail — mark submitted, view status |
| `/r/[id]` | Public (client-facing) | The shareable link — shows request details, "Fund this request" (before payment) or status + Approve/Dispute buttons (after payment) |

No login is ever required on `/r/[id]`.

---

## 10. Notifications (Email via Resend)

Send email to freelancer on:
- Request funded
- Client approved
- Auto-release triggered
- Dispute raised

Send email to client on:
- Work submitted (with countdown deadline)
- Reminder ~24h before auto-release (v1 nice-to-have, skip if time-constrained)

---

## 11. Build Order (Vertical Slices)

Build and deploy each slice fully (DB → API → UI) before starting the next. Each slice should be demoable end-to-end.

1. **Freelancer auth + create request → shareable link** (no payment yet)
2. **Client funds the link via PayPal** (Orders API — create + capture) — request moves to `funded`
3. **Freelancer marks work submitted** → countdown starts, `review_deadline` computed
4. **Approve button (client) + cron job for auto-release** → both call the same idempotent release function → PayPal Payout → `paid_out` (once the payout-succeeded webhook confirms — payouts are async, unlike a synchronous Stripe Transfer)
5. **Dispute flag** → client can mark `disputed`, freezes cron eligibility; founder resolves manually by updating DB status directly (no UI needed for this in v1)

Deploy to Vercel after slice 1 — do not wait until the end to go live.

---

## 12. Non-Functional Requirements

- All money values stored and calculated as **integer cents** — never floating point.
- Every PayPal-related mutation must be **idempotent** and driven by webhooks, not client callbacks.
- Row-Level Security in Supabase: freelancers can only read/write their own `payment_requests`; the public `/r/[id]` route uses a scoped read-only query (via a server action or API route, not direct client-side DB access).
- Use PayPal **Sandbox** + sandbox buyer accounts throughout development. Flag clearly before any switch to live credentials.

---

## 13. Open Questions (resolve before or during build, not blockers for starting)

- Exact copy/wording for the client-facing funding page (trust signals: "secured by PayPal" messaging).
- Whether to support currencies beyond ILS in v1 (default: ILS only — chosen to target Israeli freelancers/clients and avoid PayPal FX conversion fees).
- Whether platform fee is shown to the client at all, or only to the freelancer (default: freelancer only, since client pays the full amount regardless).