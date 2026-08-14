import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: freelancer } = user
    ? await supabase
        .from("freelancers")
        .select("paypal_email")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Holdfast
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-ink-muted">{user?.email}</span>
            <Link
              href={
                freelancer?.paypal_email ? "/dashboard/new" : "/settings/payout"
              }
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-hover"
            >
              בקשה חדשה
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-ink-muted hover:text-ink">
                התנתקות
              </button>
            </form>
          </nav>
        </div>
      </header>

      {freelancer && !freelancer.paypal_email && (
        <Link
          href="/settings/payout"
          className="bg-amber-tint px-6 py-2 text-center text-sm font-medium text-amber hover:opacity-80"
        >
          יש להוסיף אימייל תשלום ב-PayPal לפני יצירת בקשות ←
        </Link>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
