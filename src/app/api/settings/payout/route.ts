import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin, noStore } from "@/lib/api-route-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), noStore());
  }

  const formData = await request.formData();
  const email = String(formData.get("paypal_email") ?? "").trim();

  if (!email || !email.includes("@")) {
    const url = new URL("/settings/payout", request.url);
    url.searchParams.set("error", "נא להזין כתובת אימייל תקינה.");
    return NextResponse.redirect(url, noStore());
  }

  const { error } = await supabase
    .from("freelancers")
    .update({ paypal_email: email })
    .eq("id", user.id);

  if (error) {
    const url = new URL("/settings/payout", request.url);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url, noStore());
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), noStore());
}
