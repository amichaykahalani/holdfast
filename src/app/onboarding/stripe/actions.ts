"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getBaseUrl } from "@/lib/base-url";

export async function startStripeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("stripe_connected_account_id, email")
    .eq("id", user.id)
    .single();

  let accountId = freelancer?.stripe_connected_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: freelancer?.email ?? user.email,
      capabilities: { transfers: { requested: true } },
    });
    accountId = account.id;

    await supabase
      .from("freelancers")
      .update({ stripe_connected_account_id: accountId })
      .eq("id", user.id);
  }

  const baseUrl = await getBaseUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: `${baseUrl}/onboarding/stripe/complete`,
    refresh_url: `${baseUrl}/onboarding/stripe`,
  });

  redirect(accountLink.url);
}
