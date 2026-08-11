import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">Holdfast</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/80"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Get paid without chasing invoices.
        </h1>
        <p className="mt-6 text-lg text-black/60">
          Holdfast holds client funds in escrow until the work is approved —
          or auto-releases when the review window closes. No contracts, no
          bank forms, no client account required.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-black px-6 py-3 text-white hover:bg-black/80"
          >
            Start free
          </Link>
        </div>

        <dl className="mt-20 grid grid-cols-1 gap-8 text-left sm:grid-cols-3">
          <div>
            <dt className="font-semibold">1. Create a request</dt>
            <dd className="mt-1 text-sm text-black/60">
              Title, scope, amount, and an auto-release review window.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">2. Client funds it</dt>
            <dd className="mt-1 text-sm text-black/60">
              They open a link and pay by card — no account needed.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">3. You get paid</dt>
            <dd className="mt-1 text-sm text-black/60">
              On approval, or automatically when the timer hits zero.
            </dd>
          </div>
        </dl>
      </main>

      <footer className="border-t border-black/10 px-6 py-6 text-center text-xs text-black/40">
        Holdfast · Payments secured by Stripe
      </footer>
    </div>
  );
}
