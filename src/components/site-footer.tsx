import Link from "next/link";

export function SiteFooter() {
  return (
    <p>
      Kept ·{" "}
      <Link
        href="/terms"
        className="underline decoration-line underline-offset-2 hover:text-ink-muted"
      >
        תנאי שימוש
      </Link>{" "}
      ·{" "}
      <Link
        href="/privacy"
        className="underline decoration-line underline-offset-2 hover:text-ink-muted"
      >
        מדיניות פרטיות
      </Link>
    </p>
  );
}
