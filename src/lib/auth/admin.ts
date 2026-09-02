import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function redirectToLogin(error: "configuration" | "unauthorized"): never {
  redirect(`/admin/login?error=${error}`);
}

export async function requireAdminProfile() {
  const supabase = await createClient();

  if (!supabase) {
    redirectToLogin("configuration");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectToLogin("unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.active ||
    (profile.role !== "admin" && profile.role !== "staff")
  ) {
    redirectToLogin("unauthorized");
  }

  return profile;
}
