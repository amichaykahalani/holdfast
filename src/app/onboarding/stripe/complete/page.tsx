import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export default async function StripeOnboardingCompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("stripe_connected_account_id, stripe_onboarding_complete")
    .eq("id", user!.id)
    .single();

  let isComplete = freelancer?.stripe_onboarding_complete ?? false;

  // Live authoritative check against Stripe — we don't trust the redirect
  // itself as proof of completion, we verify with Stripe directly.
  if (!isComplete && freelancer?.stripe_connected_account_id) {
    const account = await stripe.accounts.retrieve(
      freelancer.stripe_connected_account_id,
    );
    isComplete = account.capabilities?.transfers === "active";

    if (isComplete) {
      await supabase
        .from("freelancers")
        .update({ stripe_onboarding_complete: true })
        .eq("id", user!.id);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {isComplete ? (
        <>
          <h1 className="text-xl font-semibold">You&apos;re connected</h1>
          <p className="mt-2 text-sm text-black/60">
            Stripe payouts are set up. You can now receive released funds.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Almost there</h1>
          <p className="mt-2 text-sm text-black/60">
            Stripe hasn&apos;t confirmed your account yet — this can take a
            moment, or you may need to finish a few more details.
          </p>
          <Link
            href="/onboarding/stripe"
            className="mt-4 inline-block text-sm underline"
          >
            Try again
          </Link>
        </>
      )}
      <div className="mt-6">
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
