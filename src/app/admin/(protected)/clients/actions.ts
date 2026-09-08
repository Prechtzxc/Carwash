"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import type { FormActionState } from "@/lib/form-action-state";
import { createClient } from "@/lib/supabase/server";

export type ClientActionState = FormActionState;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mobileNumberField = z
  .string()
  .trim()
  .min(7, "Enter a valid mobile number.")
  .max(32, "Enter a valid mobile number.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.startsWith("63") && digits.length === 12
      ? `0${digits.slice(2)}`
      : digits.startsWith("9") && digits.length === 10
        ? `0${digits}`
        : digits;
    return /^09\d{9}$/.test(normalized);
  }, "Enter a valid Philippine mobile number.");

const optionalEmailField = z
  .string()
  .trim()
  .max(254, "Email must be 254 characters or fewer.")
  .refine((value) => value === "" || emailPattern.test(value), "Enter a valid email address or leave it blank.")
  .transform((value) => value.toLowerCase() || null);

function optionalTextField(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null);
}

const customerProfileSchema = z.object({
  customerId: z.string().uuid("Customer id is invalid."),
  firstName: z.string().trim().min(1, "First name is required.").max(80, "First name must be 80 characters or fewer."),
  lastName: z.string().trim().min(1, "Last name is required.").max(80, "Last name must be 80 characters or fewer."),
  mobileNumber: mobileNumberField,
  email: optionalEmailField,
});

const vehicleSchema = z.object({
  vehicleId: z.string().uuid("Vehicle id is invalid."),
  vehicleCategoryId: z.string().uuid("Select a vehicle category."),
  plateNumber: optionalTextField(32, "Plate number"),
  make: optionalTextField(80, "Make"),
  model: optionalTextField(80, "Model"),
  color: optionalTextField(50, "Color"),
});

type DatabaseError = {
  code?: string;
  message?: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validationFailure(error: z.ZodError): ClientActionState {
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

function failure(message: string, fieldErrors: Record<string, string> = {}): ClientActionState {
  return { status: "error", message, fieldErrors };
}

function success(message: string): ClientActionState {
  return { status: "success", message, fieldErrors: {} };
}

function databaseFailure(error: DatabaseError, fallback: string): ClientActionState {
  if (error.code === "42501") {
    return failure("Only the active admin can edit client details.");
  }

  if (error.code === "23505") {
    return failure("Another customer already uses that mobile number.", { mobileNumber: "Choose a different mobile number." });
  }

  if (error.code === "22023") {
    const message = error.message ?? "";
    const knownMessages = [
      "Enter a valid mobile number.",
      "Enter a valid Philippine mobile number.",
      "Enter a valid email address or leave it blank.",
      "Enter a valid plate number or leave it blank.",
      "One or more vehicle details are too long.",
      "The selected vehicle category no longer exists.",
      "That customer no longer exists.",
      "That vehicle no longer exists.",
    ];

    if (knownMessages.includes(message)) {
      return failure(message);
    }
  }

  if (error.code === "23503") {
    return failure("The selected vehicle category no longer exists.");
  }

  console.error("Client mutation failed.", error.message ?? error.code ?? "Unknown database error");
  return failure(fallback);
}

async function getClientWriter() {
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

export async function updateCustomerProfileAction(
  previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  void previousState;

  const parsed = customerProfileSchema.safeParse({
    customerId: formString(formData, "customerId"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    mobileNumber: formString(formData, "mobileNumber"),
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const supabase = await getClientWriter();

  if (!supabase) {
    return failure("Only the active admin can edit client details.");
  }

  const { error } = await supabase.rpc("update_admin_customer_profile", {
    p_customer_id: parsed.data.customerId,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_mobile_number: parsed.data.mobileNumber,
    p_email: parsed.data.email,
  });

  if (error) {
    return databaseFailure(error, "We could not update that customer. Please try again.");
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${parsed.data.customerId}`);
  return success("Customer details updated.");
}

export async function updateCustomerVehicleAction(
  previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  void previousState;

  const parsed = vehicleSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    vehicleCategoryId: formString(formData, "vehicleCategoryId"),
    plateNumber: formString(formData, "plateNumber"),
    make: formString(formData, "make"),
    model: formString(formData, "model"),
    color: formString(formData, "color"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const supabase = await getClientWriter();

  if (!supabase) {
    return failure("Only the active admin can edit vehicle details.");
  }

  const { error } = await supabase.rpc("update_admin_customer_vehicle", {
    p_vehicle_id: parsed.data.vehicleId,
    p_vehicle_category_id: parsed.data.vehicleCategoryId,
    p_plate_number: parsed.data.plateNumber,
    p_make: parsed.data.make,
    p_model: parsed.data.model,
    p_color: parsed.data.color,
  });

  if (error) {
    return databaseFailure(error, "We could not update that vehicle. Please try again.");
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${formString(formData, "customerId")}`);
  return success("Vehicle details updated.");
}
