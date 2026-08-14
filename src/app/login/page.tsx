"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(translateAuthError(signInError.message));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-2xl font-semibold text-ink">התחברות</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink">
          אימייל
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          סיסמה
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-clay">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "מתחבר…" : "התחברות"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        עדיין אין לכם חשבון?{" "}
        <Link href="/signup" className="text-accent hover:text-accent-hover">
          הרשמה
        </Link>
      </p>
    </main>
  );
}
