"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { createPaymentRequest } from "../actions";
import { platformFeeCents, formatCents } from "@/lib/fee";

const REVIEW_WINDOW_OPTIONS = [
  { hours: 24, label: "24 שעות" },
  { hours: 72, label: "3 ימים" },
  { hours: 168, label: "7 ימים" },
];

export function NewRequestForm() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const amountShekels = Number(amount);
  const hasValidAmount = Number.isFinite(amountShekels) && amountShekels > 0;
  const amountCents = hasValidAmount ? Math.round(amountShekels * 100) : 0;
  const feeCents = hasValidAmount ? platformFeeCents(amountCents) : 0;

  async function action(formData: FormData) {
    setError(null);
    try {
      await createPaymentRequest(formData);
    } catch (e) {
      unstable_rethrow(e);
      setError(e instanceof Error ? e.message : "משהו השתבש.");
    }
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
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
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
        />
      </label>

      {hasValidAmount && (
        <p className="-mt-2 text-xs text-ink-muted">
          עמלת פלטפורמה: {formatCents(feeCents)} (1%, מינימום ₪10) — תקבלו{" "}
          {formatCents(amountCents - feeCents)}. הלקוח משלם{" "}
          {formatCents(amountCents)} במלואם.
        </p>
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
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-hover"
      >
        יצירת בקשה
      </button>
    </form>
  );
}
