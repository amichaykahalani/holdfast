import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — server-only, bypasses RLS. Used exclusively for the
// public /r/[id] read path (SPEC.md §12: scoped read-only query, never the
// anon key from the browser). Never import this from a Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
