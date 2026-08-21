import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSameOrigin, noStore } from "@/lib/api-route-guard";
import { REVIEW_WINDOW_HOURS, type ReviewWindowHours } from "@/types/payment-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "יש להתחבר מחדש." },
      noStore({ status: 401 }),
    );
  }

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("paypal_email")
    .eq("id", user.id)
    .single();

  if (!freelancer?.paypal_email) {
    return NextResponse.json(
      {
        error:
          "יש להוסיף אימייל תשלום ב-PayPal לפני יצירת בקשה — אחרת לא יהיה לאן לשחרר את הכספים.",
      },
      noStore({ status: 400 }),
    );
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const amountShekels = Number(body.amount);
  const reviewWindowHours = Number(body.review_window_hours) as ReviewWindowHours;

  if (!title) {
    return NextResponse.json(
      { error: "כותרת היא שדה חובה." },
      noStore({ status: 400 }),
    );
  }
  if (!Number.isFinite(amountShekels) || amountShekels <= 0) {
    return NextResponse.json(
      { error: "הסכום חייב להיות מספר חיובי." },
      noStore({ status: 400 }),
    );
  }
  if (amountShekels < 20) {
    return NextResponse.json(
      { error: "סכום הבקשה המינימלי הוא ₪20." },
      noStore({ status: 400 }),
    );
  }
  if (!REVIEW_WINDOW_HOURS.includes(reviewWindowHours)) {
    return NextResponse.json(
      { error: "תקופת בדיקה לא תקינה." },
      noStore({ status: 400 }),
    );
  }

  const amountCents = Math.round(amountShekels * 100);

  const { data: created, error } = await supabase
    .from("payment_requests")
    .insert({
      freelancer_id: user.id,
      title,
      description,
      amount_cents: amountCents,
      review_window_hours: reviewWindowHours,
      status: "awaiting_payment",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, noStore({ status: 500 }));
  }

  // Audit log write — doesn't affect the response, so it shouldn't hold up
  // the request. `after()` keeps the function alive (via Vercel's
  // waitUntil) until this finishes, without the client waiting on it.
  after(async () => {
    const admin = createAdminClient();
    await admin.from("escrow_events").insert({
      payment_request_id: created.id,
      event_type: "created",
    });
  });

  return NextResponse.json({ id: created.id }, noStore());
}
