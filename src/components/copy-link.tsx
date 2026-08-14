"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* dir="ltr": a URL is inherently left-to-right content — without
          this it sits oddly inside the page's RTL context. */}
      <input
        readOnly
        dir="ltr"
        value={url}
        className="flex-1 rounded-lg border border-line bg-accent-tint/40 px-3 py-2 text-start text-sm text-ink"
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        {copied ? "הועתק" : "העתקה"}
      </button>
    </div>
  );
}
