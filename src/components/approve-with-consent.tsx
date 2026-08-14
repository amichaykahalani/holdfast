"use client";

import { useState, useActionState } from "react";
import { RELEASE_CONSENT_TEXT } from "@/lib/consent";
import { initialActionState, type ActionState } from "./action-button";

// Same useActionState + <form action> pattern as ActionButton (see the
// comment there on why this matters for redirect()-throwing actions) — kept
// as a separate component rather than extending ActionButton, since the
// checkbox-gated consent flow only applies to this one Approve button.
export function ApproveWithConsent({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [checked, setChecked] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-5">
      <p className="text-[0.8125rem] text-ink-muted">{RELEASE_CONSENT_TEXT}</p>

      <label className="mt-3 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none accent-accent"
        />
        אני מאשר/ת את האמור לעיל
      </label>

      <input type="hidden" name="consent_text" value={RELEASE_CONSENT_TEXT} />

      <button
        type="submit"
        disabled={!checked || isPending}
        className="mt-3 w-full rounded-lg bg-accent px-4 py-3 text-[0.9375rem] font-semibold tracking-tight text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isPending ? "משחררים…" : "אישור ושחרור התשלום"}
      </button>
      {state.error && <p className="mt-2 text-sm text-clay">{state.error}</p>}
    </form>
  );
}
