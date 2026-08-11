"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function CountdownTimer({ deadline }: { deadline: string }) {
  const deadlineMs = new Date(deadline).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Avoid a server/client render mismatch — render nothing until mounted.
  if (now === null) return null;

  const remainingMs = deadlineMs - now;

  if (remainingMs <= 0) {
    return (
      <p className="text-sm font-medium text-black/70">
        Review window ended — release pending.
      </p>
    );
  }

  return (
    <p className="text-sm font-medium">{formatRemaining(remainingMs)}</p>
  );
}
