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
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">
            Holdfast
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-black/60">{user?.email}</span>
            <Link
              href={
                freelancer?.paypal_email ? "/dashboard/new" : "/settings/payout"
              }
              className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/80"
            >
              New request
            </Link>
            <form action={signOut}>
              <button type="submit" className="hover:underline">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {freelancer && !freelancer.paypal_email && (
        <Link
          href="/settings/payout"
          className="bg-amber-100 px-6 py-2 text-center text-sm font-medium text-amber-900 hover:bg-amber-200"
        >
          Add a PayPal payout email before you can create requests →
        </Link>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
