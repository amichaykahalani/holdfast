# Holdfast — Product & Technical Specification

> This is the source of truth for building Holdfast. Treat every detail here as a firm requirement unless explicitly marked "future / v2". When in doubt, favor the simplest implementation that satisfies the requirement.

---

## 1. Product Overview

**Holdfast** is a low-friction escrow platform for independent freelancers (designers, developers, consultants) and their direct clients.

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
| Freelancer | Yes | Creates requests, connects Stripe (payout), submits work, resolves disputes |
| Client | No | Opens a link, pays, approves or disputes — no login required |
| Admin (you) | Manual/internal only | Reviews disputes via Supabase Studio or a minimal internal view — **no admin UI in v1** |

---

## 3. Scope for v1 (MVP) — Build ONLY This

✅ In scope:
- Freelancer signup/login + Stripe Connect (Express) onboarding
- Create a payment request (title, description, amount, review window: 24h / 3 days / 7 days)
- Shareable public link per request
- Client funds the request via Stripe (card payment), no account needed
- Freelancer marks work as "submitted" (optional link/note attached)
- Countdown timer starts on submission
- Client can "Approve" (manual release) or do nothing (auto-release at timer expiry)
- Client can flag "Dispute" — freezes timer, funds stay locked, status becomes `disputed`
- Email notifications at each key state change
- Platform fee: 3.5% of transaction amount, minimum $3, deducted from freelancer payout, shown transparently before request creation

❌ Explicitly OUT of scope for v1 (do not build):
- Multi-milestone projects
- In-app chat/messaging
- Admin dashboard UI (use Supabase Studio / direct DB queries manually)
- Mobile app
- Any dispute *resolution* automation — v1 dispute handling is just "freeze + flag for manual review," resolved by the founder manually via email/Slack
- Non-card payment methods (e.g., bank transfer, wallets) — Stripe card payments only

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
| stripe_connected_account_id | text, nullable | set after Stripe Express onboarding completes |
| stripe_onboarding_complete | boolean, default false | |
| created_at | timestamptz | |

### `payment_requests`
| column | type | notes |
|---|---|---|
| id | uuid, PK | also used in the public link, e.g. `/r/{id}` |
| freelancer_id | uuid, FK → freelancers | |
| title | text | |
| description | text | |
| amount_cents | integer | store money as integer cents, never floats |
| currency | text, default 'usd' | |
| review_window_hours | integer | 24 / 72 / 168 |
| status | text | one of the status machine values above |
| stripe_payment_intent_id | text, nullable | |
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
| event_type | text | e.g. `created`, `funded`, `submitted`, `approved`, `auto_released`, `disputed`, `resolved_release`, `resolved_refund` |
| metadata | jsonb, nullable | raw Stripe event data, admin notes, etc. |
| created_at | timestamptz | |

---

## 6. Tech Stack

- **Framework:** Next.js (App Router), TypeScript
- **Hosting:** Vercel
- **Database + Auth:** Supabase (Postgres, Auth for freelancers only, Row-Level Security enabled)
- **Payments:** Stripe Connect — Express accounts for freelancer payouts
- **Scheduled jobs:** Vercel Cron (or Supabase Cron) — runs every few minutes to check for expired `review_deadline` values and trigger auto-release
- **Email:** Resend (transactional emails)
- **Styling:** Tailwind CSS

---

## 7. Stripe Integration Details

### Account model
- Platform holds funds in its own Stripe balance (freelancer is **not** the merchant of record).
- Freelancers onboard via **Stripe Express** connected accounts (fastest KYC flow, Stripe-hosted).

### Payment flow
1. On request funding: create a Stripe **PaymentIntent** (or Checkout Session) charged to the **platform account**, not directly to the connected account. Capture funds into platform balance.
2. On release (approve or auto-release): create a Stripe **Transfer** from the platform balance to the freelancer's connected account, amount = `amount_cents - platform_fee`.
3. Platform fee = `max(round(amount_cents * 0.035), 300)` (3.5%, minimum $3.00 / 300 cents).

### Critical requirements
- **All state transitions must be driven by Stripe webhook events** (e.g. `payment_intent.succeeded`), not just client-side success callbacks. Never trust the browser alone to confirm a payment.
- **The release function must be idempotent.** Both the "Approve" button and the cron job may call it — guard against double-transfer (e.g. check `status` is still `work_submitted` inside a DB transaction before transferring, and log to `escrow_events` before calling Stripe).
- Use Stripe **test mode** exclusively during development. Do not use live keys until explicitly instructed.
- Store `stripe_payment_intent_id` and `stripe_connected_account_id` for traceability.

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
| `/` | Public | Marketing/landing page explaining Holdfast |
| `/signup`, `/login` | Public | Freelancer auth |
| `/onboarding/stripe` | Freelancer | Redirects to Stripe Express onboarding |
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
2. **Client funds the link via Stripe** (Checkout or Payment Element) — request moves to `funded`
3. **Freelancer marks work submitted** → countdown starts, `review_deadline` computed
4. **Approve button (client) + cron job for auto-release** → both call the same idempotent release function → Stripe Transfer → `paid_out`
5. **Dispute flag** → client can mark `disputed`, freezes cron eligibility; founder resolves manually by updating DB status directly (no UI needed for this in v1)

Deploy to Vercel after slice 1 — do not wait until the end to go live.

---

## 12. Non-Functional Requirements

- All money values stored and calculated as **integer cents** — never floating point.
- Every Stripe-related mutation must be **idempotent** and driven by webhooks, not client callbacks.
- Row-Level Security in Supabase: freelancers can only read/write their own `payment_requests`; the public `/r/[id]` route uses a scoped read-only query (via a server action or API route, not direct client-side DB access).
- Use Stripe test mode + test card numbers throughout development. Flag clearly before any switch to live mode.

---

## 13. Open Questions (resolve before or during build, not blockers for starting)

- Exact copy/wording for the client-facing funding page (trust signals: "secured by Stripe" messaging).
- Whether to support currencies beyond USD in v1 (default: USD only).
- Whether platform fee is shown to the client at all, or only to the freelancer (default: freelancer only, since client pays the full amount regardless).