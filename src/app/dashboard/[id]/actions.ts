"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markSubmitted(requestId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: request } = await supabase
    .from("payment_requests")
    .select("review_window_hours")
    .eq("id", requestId)
    .single();

  if (!request) throw new Error("הבקשה לא נמצאה.");

  const submissionNote = String(formData.get("submission_note") ?? "").trim();
  const now = new Date();
  const reviewDeadline = new Date(
    now.getTime() + request.review_window_hours * 3600_000,
  );

  const { data: updated, error } = await supabase
    .from("payment_requests")
    .update({
      status: "work_submitted",
      submitted_at: now.toISOString(),
      review_deadline: reviewDeadline.toISOString(),
      submission_note: submissionNote || null,
    })
    .eq("id", requestId)
    .eq("freelancer_id", user.id)
    .eq("status", "funded")
    .select("id");

  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("הבקשה אינה ממתינה כרגע למסירה.");
  }

  const admin = createAdminClient();
  await admin.from("escrow_events").insert({
    payment_request_id: requestId,
    event_type: "submitted",
  });

  redirect(`/dashboard/${requestId}`);
}
