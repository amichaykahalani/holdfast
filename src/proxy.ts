import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/") {
    const code = searchParams.get("code");
    if (code) {
      // Confirmation emails sent while Supabase's Site URL pointed at this
      // domain's root (instead of /auth/callback) land the PKCE code here.
      // Forward it so the session exchange still completes for anyone who
      // already has one of those emails sitting in their inbox — without
      // this, the code is silently dropped and the account never confirms.
      const callbackUrl = new URL("/auth/callback", request.url);
      callbackUrl.searchParams.set("code", code);
      return NextResponse.redirect(callbackUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/settings/:path*"],
};
