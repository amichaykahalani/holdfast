import Stripe from "stripe";

// Server-only. Never import from a Client Component.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
