"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";

export function FundButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await action();
            } catch (e) {
              unstable_rethrow(e);
              setError(e instanceof Error ? e.message : "Something went wrong.");
            }
          })
        }
        className="mt-6 w-full rounded-md bg-black px-4 py-3 font-medium text-white hover:bg-black/80 disabled:opacity-50"
      >
        {isPending ? "Redirecting to Stripe…" : "Fund this request"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
