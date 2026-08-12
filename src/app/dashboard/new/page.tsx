import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewRequestForm } from "./new-request-form";

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("paypal_email")
    .eq("id", user!.id)
    .single();

  if (!freelancer?.paypal_email) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-semibold">Add a PayPal payout email first</h1>
        <p className="mt-2 text-sm text-black/60">
          You need a payout email on file before you can create a request —
          otherwise there&apos;d be nowhere for released funds to go.
        </p>
        <Link
          href="/settings/payout"
          className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/80"
        >
          Add payout email
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold">New payment request</h1>
      <NewRequestForm />
    </div>
  );
}
