-- Cron runs log an escrow_events row every sweep, even when zero requests
-- match (SPEC.md §8) — that row isn't tied to a single payment_request.
alter table escrow_events alter column payment_request_id drop not null;
