-- Payment provider switch: Stripe -> PayPal (Orders + Payouts API).
-- Payouts API means no onboarding/KYC step at all -- "onboarded" becomes
-- simply "has a paypal_email on file".

alter table freelancers drop column if exists stripe_connected_account_id;
alter table freelancers drop column if exists stripe_onboarding_complete;
alter table freelancers add column if not exists paypal_email text;

alter table payment_requests rename column stripe_payment_intent_id to paypal_order_id;
alter table payment_requests add column if not exists paypal_payout_item_id text;
