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
        className="mt-6 w-full rounded-md bg-black px-4 py-3 font-medium text-white hover:bg-black/80 disabled:opacity-50"
      >
        {isPending ? pendingLabel : label}
      </button>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
