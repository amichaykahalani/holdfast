"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { platformFeeCents, formatCents } from "@/lib/fee";

const REVIEW_WINDOW_OPTIONS = [
  { hours: 24, label: "24 שעות" },
  { hours: 72, label: "3 ימים" },
  { hours: 168, label: "7 ימים" },
];

export function NewRequestForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountShekels = Number(amount);
  const hasValidAmount = Number.isFinite(amountShekels) && amountShekels > 0;
  const isBelowMinimum = hasValidAmount && amountShekels < 20;
  const amountCents = hasValidAmount ? Math.round(amountShekels * 100) : 0;
  const feeCents = hasValidAmount ? platformFeeCents(amountCents) : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (isBelowMinimum) return;
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          amount: formData.get("amount"),
          review_window_hours: formData.get("review_window_hours"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "משהו השתבש.");
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/${data.id}`);
    } catch {
      setError("משהו השתבש.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-ink">
        כותרת
        <input
          name="title"
          type="text"
          required
          placeholder="עיצוב מחדש של דף הנחיתה"
          className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink">
        תיאור / היקף העבודה
        <textarea
          name="description"
          rows={4}
          placeholder="מה כלול בבקשה הזו"
          className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink">
        סכום (₪)
        <input
          name="amount"
          type="number"
          required
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
        />
      </label>

      {isBelowMinimum ? (
        <p className="-mt-2 text-sm text-clay">סכום הבקשה המינימלי הוא ₪20.</p>
      ) : (
        hasValidAmount && (
          <p className="-mt-2 text-xs text-ink-muted">
            עמלת פלטפורמה: {formatCents(feeCents)} (1%, מינימום משתנה לפי הסכום) — תקבלו{" "}
            {formatCents(amountCents - feeCents)}. הלקוח משלם{" "}
            {formatCents(amountCents)} במלואם.
          </p>
        )
      )}

      <label className="flex flex-col gap-1 text-sm text-ink">
        תקופת בדיקה
        <select
          name="review_window_hours"
          defaultValue={72}
          className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
        >
          {REVIEW_WINDOW_OPTIONS.map((opt) => (
            <option key={opt.hours} value={opt.hours}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-clay">{error}</p>}

      <button
        type="submit"
        disabled={submitting || isBelowMinimum}
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "יוצרים…" : "יצירת בקשה"}
      </button>
    </form>
  );
}
