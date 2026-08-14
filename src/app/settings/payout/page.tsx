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
      <h1 className="text-xl font-semibold text-ink">אימייל תשלום</h1>
      <p className="mt-2 text-sm text-ink-muted">
        כספים ששוחררו יישלחו לאימייל הזה דרך PayPal Payouts. הוא לא חייב
        להיות כבר משויך לחשבון PayPal קיים — אם לא, למקבל/ת יש 30 יום
        להירשם ולקבל את התשלום.
      </p>

      <form action={savePayoutEmail} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink">
          אימייל PayPal
          <input
            name="paypal_email"
            type="email"
            dir="ltr"
            required
            defaultValue={freelancer?.paypal_email ?? ""}
            placeholder="you@example.com"
            className="rounded-lg border border-line px-3 py-2 text-end focus:border-accent focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          שמירה
        </button>
      </form>
    </div>
  );
}
