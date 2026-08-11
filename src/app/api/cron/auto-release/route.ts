import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseFunds } from "@/lib/release";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: due } = await admin
    .from("payment_requests")
    .select("id")
    .eq("status", "work_submitted")
    .lte("review_deadline", new Date().toISOString());

  const results = [];
  for (const row of due ?? []) {
    const result = await releaseFunds(row.id, "auto_released");
    results.push({ id: row.id, ...result });
  }

  // SPEC.md §8: log a row every run, even when nothing matched.
  await admin.from("escrow_events").insert({
    payment_request_id: null,
    event_type: "cron_run",
    metadata: { matched: due?.length ?? 0, results },
  });

  return NextResponse.json({ matched: due?.length ?? 0, results });
}
