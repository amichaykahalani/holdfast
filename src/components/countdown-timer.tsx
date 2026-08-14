"use client";

import { useEffect, useState } from "react";

function formatFigure(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}י ${hours}ש`;
  if (hours > 0) return `${hours}ש ${minutes}ד`;
  return `${minutes}ד`;
}

interface CountdownTimerProps {
  deadline: string;
  /**
   * When provided together, renders the richer card layout — a label, a
   * monospace tabular figure, and a thin bar showing how much of the
   * review window has elapsed. Omit both for the old plain-sentence style.
   */
  submittedAt?: string;
  totalHours?: number;
}

export function CountdownTimer({
  deadline,
  submittedAt,
  totalHours,
}: CountdownTimerProps) {
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
      <p className="text-sm font-medium text-ink-muted">
        תקופת הבדיקה הסתיימה — השחרור בהמתנה.
      </p>
    );
  }

  const figure = formatFigure(remainingMs);

  if (submittedAt && totalHours) {
    const submittedMs = new Date(submittedAt).getTime();
    const totalMs = totalHours * 3600_000;
    const elapsedFraction = Math.min(
      Math.max((now - submittedMs) / totalMs, 0),
      1,
    );

    return (
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-ink-faint">
            זמן שנותר
          </span>
          <span className="font-mono text-sm font-medium tabular-nums text-ink">
            {figure}
          </span>
        </div>
        {/* flex (not a plain block width) so the fill's main-start
            alignment is direction-aware under dir="rtl" for free. */}
        <div className="flex h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-amber"
            style={{ width: `${elapsedFraction * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return <p className="text-sm font-medium">נותרו {figure}</p>;
}
