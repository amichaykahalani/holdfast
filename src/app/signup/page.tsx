"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      return;
    }

    if (!data.session) {
      // Email confirmation is required before a session exists.
      setConfirmSent(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (confirmSent) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink">בדקו את האימייל</h1>
        <p className="mt-3 text-sm text-ink-muted">
          שלחנו קישור אישור לכתובת {email}. יש ללחוץ עליו כדי להפעיל את
          החשבון, ואז להתחבר.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-2xl font-semibold text-ink">יצירת חשבון</h1>
      <p className="mt-1 text-sm text-ink-muted">
        לפרילנסרים בלבד — לקוחות לא צריכים חשבון.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink">
          שם
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
          />
        </label>
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
            minLength={8}
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
          {loading ? "יוצר חשבון…" : "הרשמה"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        כבר יש לכם חשבון?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          התחברות
        </Link>
      </p>
    </main>
  );
}
