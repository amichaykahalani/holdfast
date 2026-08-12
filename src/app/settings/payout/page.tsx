import { createClient } from "@/lib/supabase/server";
import { savePayoutEmail } from "./actions";

export default async function PayoutSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("paypal_email")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-xl font-semibold">Payout email</h1>
      <p className="mt-2 text-sm text-black/60">
        Released funds are sent to this PayPal email via PayPal Payouts. It
        doesn&apos;t need to already be a PayPal account — if it isn&apos;t,
        the recipient has 30 days to sign up and claim the payment.
      </p>

      <form action={savePayoutEmail} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          PayPal email
          <input
            name="paypal_email"
            type="email"
            required
            defaultValue={freelancer?.paypal_email ?? ""}
            placeholder="you@example.com"
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="mt-2 self-start rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
        >
          Save
        </button>
      </form>
    </div>
  );
}
