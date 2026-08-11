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
              href="/dashboard/new"
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
