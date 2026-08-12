"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function savePayoutEmail(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = String(formData.get("paypal_email") ?? "").trim();
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const { error } = await supabase
    .from("freelancers")
    .update({ paypal_email: email })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  redirect("/dashboard");
}
