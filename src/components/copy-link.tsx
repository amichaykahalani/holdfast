"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        className="flex-1 rounded-md border border-black/20 bg-black/5 px-3 py-2 text-sm"
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-black/80"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
