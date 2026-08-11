import { createClient } from "@/lib/supabase/server";
import { startStripeOnboarding } from "./actions";

export default async function StripeOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("stripe_onboarding_complete")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {freelancer?.stripe_onboarding_complete ? (
        <>
          <h1 className="text-xl font-semibold">Stripe is connected</h1>
          <p className="mt-2 text-sm text-black/60">
            You&apos;re all set to receive payouts.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Connect Stripe to get paid</h1>
          <p className="mt-2 text-sm text-black/60">
            Holdfast uses Stripe Express to send you payouts. Takes a couple
            of minutes.
          </p>
          <form action={startStripeOnboarding} className="mt-6">
            <button
              type="submit"
              className="rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/80"
            >
              Connect with Stripe
            </button>
          </form>
        </>
      )}
    </div>
  );
}
