"use client";

import { useActionState } from "react";

export interface ActionState {
  error: string | null;
}

export const initialActionState: ActionState = { error: null };

// useActionState (not a manual onClick + startTransition + try/catch) is
// what makes this play nicely with actions that call redirect() — React's
// own form-action dispatch cooperates with Next's redirect-via-throw
// mechanism. A manually invoked startTransition doesn't get that
// cooperation: the redirect still completes (Next's action-fetch layer
// detects it independently), but React's transition machinery also treats
// the re-thrown NEXT_REDIRECT as a stray transition error and reports it
// to the console (surfaced as a generic "error in Server Components
// render" — minified error #441) — harmless, but a confusing false alarm
// on a client-facing page.
export function ActionButton({
  action,
  label,
  pendingLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full rounded-lg bg-accent px-4 py-3 text-[0.9375rem] font-semibold tracking-tight text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isPending ? pendingLabel : label}
      </button>
      {state.error && <p className="mt-2 text-sm text-clay">{state.error}</p>}
    </form>
  );
}
