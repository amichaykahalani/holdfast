-- Switch the default currency to ILS (Israeli shekel) — targeting
-- Israeli freelancers/clients avoids PayPal's FX conversion fees.
-- Existing rows are left untouched: their amount_cents is priced in
-- whatever currency they were actually created in, so relabeling them
-- without an actual FX conversion would misrepresent real amounts.
alter table payment_requests alter column currency set default 'ils';
