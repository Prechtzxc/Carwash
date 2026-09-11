"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import type { FormActionState } from "@/lib/form-action-state";
import { createClient } from "@/lib/supabase/server";

export type StaffActionState = FormActionState;

const staffSchema = z.object({
  id: z.string().uuid("Staff record id is invalid.").optional(),
  name: z.string().trim().min(1, "Name is required.").max(120, "Name must be 120 characters or fewer."),
  mobileNumber: z
    .string()
    .trim()
    .max(32, "Mobile number must be 32 characters or fewer.")
    .transform((value) => value || null),
});

const toggleSchema = z.object({
  id: z.string().uuid("Staff record id is invalid."),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

type DatabaseError = {
  code?: string;
  message?: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validationFailure(error: z.ZodError): StaffActionState {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors,
  };
}

function failure(message: string, fieldErrors: Record<string, string> = {}): StaffActionState {
  return { status: "error", message, fieldErrors };
}

function success(message: string): StaffActionState {
  return { status: "success", message, fieldErrors: {} };
}

function databaseFailure(error: DatabaseError): StaffActionState {
  if (error.code === "23505") {
    return failure("A staff member with that name already exists.");
  }

  if (error.code === "42501") {
    return failure("Only the active admin can manage staff records.");
  }

  console.error("Staff mutation failed.", error.message ?? error.code ?? "Unknown database error");
  return failure("We could not save that staff record. Please try again.");
}

async function getStaffWriter() {
  const profile = await requireAdminProfile();

  if (profile.role !== "admin") {
    return null;
  }

  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function revalidateStaffPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/sales/staff");
  revalidatePath("/admin/transactions/[id]", "page");
}

export async function saveStaffAction(
  previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  void previousState;

  const supabase = await getStaffWriter();

  if (!supabase) {
    return failure("Only the active admin can manage staff records.");
  }

  const parsed = staffSchema.safeParse({
    id: formString(formData, "id").trim() || undefined,
    name: formString(formData, "name"),
    mobileNumber: formString(formData, "mobileNumber"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const values = {
    name: parsed.data.name,
    mobile_number: parsed.data.mobileNumber,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("staff")
      .update(values)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return databaseFailure(error);
    }

    if (!data) {
      return failure("That staff record no longer exists.");
    }

    revalidateStaffPaths();
    return success("Staff record updated.");
  }

  const { error } = await supabase.from("staff").insert(values);

  if (error) {
    return databaseFailure(error);
  }

  revalidateStaffPaths();
  return success("Staff member added.");
}

export async function toggleStaffAction(
  previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  void previousState;

  const supabase = await getStaffWriter();

  if (!supabase) {
    return failure("Only the active admin can manage staff records.");
  }

  const parsed = toggleSchema.safeParse({
    id: formString(formData, "id"),
    active: formString(formData, "active"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { data, error } = await supabase
    .from("staff")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseFailure(error);
  }

  if (!data) {
    return failure("That staff record no longer exists.");
  }

  revalidateStaffPaths();
  return success(parsed.data.active ? "Staff member enabled." : "Staff member disabled.");
}
