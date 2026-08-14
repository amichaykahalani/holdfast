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
        <h1 className="text-xl font-semibold text-ink">
          יש להוסיף אימייל תשלום ב-PayPal קודם
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          נדרש אימייל תשלום שמור לפני יצירת בקשה — אחרת לא יהיה לאן לשחרר את
          הכספים.
        </p>
        <Link
          href="/settings/payout"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          הוספת אימייל תשלום
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold text-ink">בקשת תשלום חדשה</h1>
      <NewRequestForm />
    </div>
  );
}
