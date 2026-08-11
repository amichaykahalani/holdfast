-- Holdfast v1 schema (SPEC.md §5) + RLS (SPEC.md §12)
-- Run in the Supabase SQL editor, or via `supabase db push` once the project is linked.

create table if not exists freelancers (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  name text,
  stripe_connected_account_id text,
  stripe_onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references freelancers (id) on delete cascade,
  title text not null,
  description text not null default '',
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  review_window_hours integer not null check (review_window_hours in (24, 72, 168)),
  status text not null default 'draft' check (status in (
    'draft',
    'awaiting_payment',
    'funded',
    'work_submitted',
    'approved',
    'auto_released',
    'disputed',
    'resolved_release',
    'resolved_refund',
    'paid_out',
    'refunded'
  )),
  stripe_payment_intent_id text,
  funded_at timestamptz,
  submitted_at timestamptz,
  submission_note text,
  review_deadline timestamptz,
  released_at timestamptz,
  dispute_reason text,
  created_at timestamptz not null default now()
);

create index if not exists payment_requests_freelancer_id_idx on payment_requests (freelancer_id);
create index if not exists payment_requests_status_review_deadline_idx on payment_requests (status, review_deadline);

create table if not exists escrow_events (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references payment_requests (id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists escrow_events_payment_request_id_idx on escrow_events (payment_request_id);

alter table freelancers enable row level security;
alter table payment_requests enable row level security;
alter table escrow_events enable row level security;

-- freelancers: a user can read/update only their own row.
create policy "freelancers_select_own" on freelancers
  for select using (auth.uid() = id);

create policy "freelancers_update_own" on freelancers
  for update using (auth.uid() = id);

create policy "freelancers_insert_own" on freelancers
  for insert with check (auth.uid() = id);

-- payment_requests: a freelancer can read/insert/update only their own requests.
-- No public SELECT policy — the public /r/[id] page reads via the service-role
-- client on the server, never the anon key from the browser (SPEC.md §12).
create policy "payment_requests_select_own" on payment_requests
  for select using (auth.uid() = freelancer_id);

create policy "payment_requests_insert_own" on payment_requests
  for insert with check (auth.uid() = freelancer_id);

create policy "payment_requests_update_own" on payment_requests
  for update using (auth.uid() = freelancer_id);

-- escrow_events: append-only audit log, server-side (service role) writes only.
-- No client-side policies — RLS enabled with no policies denies all client access.

-- Auto-create the freelancers row when a new auth user signs up (name comes
-- from the `name` field passed via supabase.auth.signUp options.data). Runs
-- as the table owner so it isn't blocked by RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.freelancers (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
