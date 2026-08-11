"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { createPaymentRequest } from "../actions";
import { platformFeeCents, formatCents } from "@/lib/fee";

const REVIEW_WINDOW_OPTIONS = [
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
];

export default function NewRequestPage() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const amountDollars = Number(amount);
  const hasValidAmount = Number.isFinite(amountDollars) && amountDollars > 0;
  const amountCents = hasValidAmount ? Math.round(amountDollars * 100) : 0;
  const feeCents = hasValidAmount ? platformFeeCents(amountCents) : 0;

  async function action(formData: FormData) {
    setError(null);
    try {
      await createPaymentRequest(formData);
    } catch (e) {
      unstable_rethrow(e);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold">New payment request</h1>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            name="title"
            type="text"
            required
            placeholder="Landing page redesign"
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Description / scope
          <textarea
            name="description"
            rows={4}
            placeholder="What's included in this request"
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Amount (USD)
          <input
            name="amount"
            type="number"
            required
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        {hasValidAmount && (
          <p className="-mt-2 text-xs text-black/60">
            Platform fee: {formatCents(feeCents)} (3.5%, min $3) — you&apos;ll
            receive {formatCents(amountCents - feeCents)}. The client pays the
            full {formatCents(amountCents)}.
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Review window
          <select
            name="review_window_hours"
            defaultValue={72}
            className="rounded-md border border-black/20 px-3 py-2"
          >
            {REVIEW_WINDOW_OPTIONS.map((opt) => (
              <option key={opt.hours} value={opt.hours}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-md bg-black px-4 py-2 text-white hover:bg-black/80"
        >
          Create request
        </button>
      </form>
    </div>
  );
}
