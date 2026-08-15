import { NextResponse } from "next/server";

// Next's Server Actions verify the request's Origin automatically; plain
// Route Handlers don't. Since these routes replace Server Actions that used
// to get that for free, check it explicitly here.
export function requireSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return null;
}

// Explicit Cache-Control on every response from these routes — belt and
// suspenders. Route Handlers reading cookies() are dynamic by default, but
// given how surprising the Server-Action-on-static-page caching bug this
// replaces turned out to be (see git history), explicit beats implicit here.
export function noStore(init: ResponseInit = {}): ResponseInit {
  return {
    ...init,
    headers: { ...init.headers, "Cache-Control": "no-store" },
  };
}
