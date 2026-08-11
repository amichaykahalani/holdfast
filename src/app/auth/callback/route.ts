import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// @supabase/ssr defaults to the PKCE flow (see createBrowserClient/
// createServerClient), so email confirmation links redirect here with a
// `code` param after Supabase's own /verify endpoint validates the token —
// this is what exchanges that code for an actual session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
