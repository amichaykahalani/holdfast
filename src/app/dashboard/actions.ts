"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_WINDOW_HOURS, type ReviewWindowHours } from "@/types/payment-request";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createPaymentRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("paypal_email")
    .eq("id", user.id)
    .single();

  if (!freelancer?.paypal_email) {
    throw new Error(
      "יש להוסיף אימייל תשלום ב-PayPal לפני יצירת בקשה — אחרת לא יהיה לאן לשחרר את הכספים.",
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountShekels = Number(formData.get("amount"));
  const reviewWindowHours = Number(
    formData.get("review_window_hours"),
  ) as ReviewWindowHours;

  if (!title) throw new Error("כותרת היא שדה חובה.");
  if (!Number.isFinite(amountShekels) || amountShekels <= 0) {
    throw new Error("הסכום חייב להיות מספר חיובי.");
  }
  if (amountShekels < 20) {
    throw new Error("סכום הבקשה המינימלי הוא ₪20.");
  }
  if (!REVIEW_WINDOW_HOURS.includes(reviewWindowHours)) {
    throw new Error("תקופת בדיקה לא תקינה.");
  }

  const amountCents = Math.round(amountShekels * 100);

  const { data: request, error } = await supabase
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

  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  await admin.from("escrow_events").insert({
    payment_request_id: request.id,
    event_type: "created",
  });

  redirect(`/dashboard/${request.id}`);
}
