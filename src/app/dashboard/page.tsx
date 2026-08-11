import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/fee";
import { STATUS_LABELS } from "@/lib/status";
import type { PaymentRequest } from "@/types/payment-request";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<PaymentRequest[]>();

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-xl font-semibold">No requests yet</h1>
        <p className="text-sm text-black/60">
          Create your first payment request to get a shareable link.
        </p>
        <Link
          href="/dashboard/new"
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
        >
          New request
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Your requests</h1>
      <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
        {requests.map((request) => (
          <li key={request.id}>
            <Link
              href={`/dashboard/${request.id}`}
              className="flex items-center justify-between px-2 py-4 hover:bg-black/5"
            >
              <div>
                <p className="font-medium">{request.title}</p>
                <p className="text-sm text-black/60">
                  {formatCents(request.amount_cents, request.currency)}
                </p>
              </div>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium">
                {STATUS_LABELS[request.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
