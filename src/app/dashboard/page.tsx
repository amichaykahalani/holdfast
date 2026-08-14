import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/fee";
import { StatusChip } from "@/components/status-chip";
import type { PaymentRequest } from "@/types/payment-request";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("paypal_email")
    .eq("id", user!.id)
    .single();
  const { data: requests } = await supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<PaymentRequest[]>();

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-ink">עדיין אין בקשות</h1>
        <p className="text-sm text-ink-muted">
          צרו את בקשת התשלום הראשונה שלכם כדי לקבל קישור לשיתוף.
        </p>
        <Link
          href={
            freelancer?.paypal_email ? "/dashboard/new" : "/settings/payout"
          }
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          בקשה חדשה
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">הבקשות שלכם</h1>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {requests.map((request) => (
          <li key={request.id}>
            <Link
              href={`/dashboard/${request.id}`}
              className="flex items-center justify-between px-2 py-4 hover:bg-accent-tint/40"
            >
              <div>
                <p className="font-medium text-ink">{request.title}</p>
                <p className="font-mono text-sm tabular-nums text-ink-muted">
                  {formatCents(request.amount_cents, request.currency)}
                </p>
              </div>
              <StatusChip status={request.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
