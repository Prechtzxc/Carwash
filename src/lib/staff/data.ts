import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type StaffRow = Database["public"]["Tables"]["staff"]["Row"];

export type AdminStaff = Pick<StaffRow, "id" | "name" | "mobile_number" | "active" | "created_at" | "updated_at">;

export type AdminStaffData = {
  staff: AdminStaff[];
};

export async function getAdminStaffData(): Promise<AdminStaffData> {
  await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("staff")
    .select("id, name, mobile_number, active, created_at, updated_at")
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Staff records could not be loaded.");
  }

  return { staff: data ?? [] };
}
