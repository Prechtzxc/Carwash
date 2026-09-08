"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import type { FormActionState } from "@/lib/form-action-state";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type TransactionActionState = FormActionState;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mobileNumberField = z
  .string()
  .trim()
  .min(7, "Enter a valid mobile number.")
  .max(32, "Enter a valid mobile number.")
  .transform((value) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("63")) {
      return `0${digits.slice(2)}`;
    }

    if (digits.length === 10 && digits.startsWith("9")) {
      return `0${digits}`;
    }

    return digits;
  })
  .refine((value) => /^09\d{9}$/.test(value), "Enter a valid Philippine mobile number.");

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

const productLineSchema = z.object({
  inventoryItemId: z.string().uuid("Product selection is invalid."),
  quantity: z.coerce
    .number()
    .finite()
    .int("Product quantity must be a whole number.")
    .positive("Product quantity must be greater than zero.")
    .max(99, "Product quantity cannot exceed 99."),
});

const revisionSchema = z.object({
  transactionId: z.string().uuid("Transaction id is invalid."),
  firstName: z.string().trim().min(1, "First name is required.").max(80, "First name must be 80 characters or fewer."),
  lastName: z.string().trim().min(1, "Last name is required.").max(80, "Last name must be 80 characters or fewer."),
  mobileNumber: mobileNumberField,
  email: optionalEmailField,
  vehicleCategoryId: z.string().uuid("Select a vehicle category."),
  plateNumber: optionalTextField(32, "Plate number"),
  make: optionalTextField(80, "Make"),
  model: optionalTextField(80, "Model"),
  color: optionalTextField(50, "Color"),
  serviceIds: z.array(z.string().uuid("Service selection is invalid.")).min(1, "Select at least one service.").max(20, "Select fewer services."),
  productLines: z.array(productLineSchema).max(20, "Select fewer products."),
}).superRefine((value, context) => {
  if (new Set(value.serviceIds).size !== value.serviceIds.length) {
    context.addIssue({ code: "custom", message: "A service may only be selected once.", path: ["serviceIds"] });
  }

  if (new Set(value.productLines.map((line) => line.inventoryItemId)).size !== value.productLines.length) {
    context.addIssue({ code: "custom", message: "A product may only be selected once.", path: ["productLines"] });
  }
});

const transactionIdSchema = z.object({
  transactionId: z.string().uuid("Transaction id is invalid."),
});

const cancellationSchema = transactionIdSchema.extend({
  reason: z.string().trim().max(500, "The cancellation reason must be 500 characters or fewer."),
});

type DatabaseError = {
  code?: string;
  message?: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function jsonFormValue(formData: FormData, key: string) {
  const value = formString(formData, key);

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function validationFailure(error: z.ZodError): TransactionActionState {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    status: "error",
    message: "Check the highlighted details.",
    fieldErrors,
  };
}

function failure(message: string, fieldErrors: Record<string, string> = {}): TransactionActionState {
  return { status: "error", message, fieldErrors };
}

function databaseFailure(error: DatabaseError): TransactionActionState {
  if (error.code === "42501") {
    return failure("Only the active admin can manage transactions.");
  }

  if (error.code === "23503") {
    return failure("A referenced catalog or customer record no longer exists.");
  }

  if (error.code === "22023") {
    if (error.message?.startsWith("Insufficient stock:")) {
      return failure(error.message);
    }

    if (error.message?.includes("already completed")) {
      return failure("That transaction is already completed. Refresh the page to verify its status.");
    }

    if (error.message?.includes("Only confirmed transactions can be completed")) {
      return failure("Only confirmed transactions can be completed.");
    }

    if (error.message?.includes("Only pending transactions can be edited")) {
      return failure("Only pending transactions can be edited.");
    }

    if (error.message?.includes("Only pending transactions can be confirmed")) {
      return failure("Only pending transactions can be confirmed.");
    }

    if (error.message?.includes("Only pending or confirmed transactions can be cancelled")) {
      return failure("Only pending or confirmed transactions can be cancelled.");
    }

    if (error.message?.includes("no longer exists")) {
      return failure("That transaction no longer exists. Return to the dashboard and refresh.");
    }

    if (error.message?.includes("no longer available")) {
      return failure("A selected catalog item is no longer available. Refresh and review the request again.");
    }

    return failure(error.message ?? "The transaction could not be updated.");
  }

  console.error("Transaction mutation failed.", error.message ?? error.code ?? "Unknown database error");
  return failure("We could not update that transaction. Please try again.");
}

function completionDatabaseFailure(error: DatabaseError): TransactionActionState {
  if (error.code === "42501") {
    return failure("Only the active admin can complete transactions.");
  }

  if (error.code === "22023") {
    const message = error.message ?? "";

    if (message.startsWith("Insufficient stock:")) {
      return failure(message);
    }

    if (message.includes("already completed")) {
      return failure("That transaction is already completed. Refresh the page to verify its status.");
    }

    if (message.includes("Only confirmed transactions can be completed")) {
      return failure("Only confirmed transactions can be completed.");
    }

    if (message.includes("no longer exists")) {
      return failure("That transaction no longer exists. Return to the dashboard and refresh.");
    }

    if (message.includes("required inventory item")) {
      return failure("A required inventory item is no longer available. Refresh and review the transaction.");
    }

    return failure("The transaction could not be completed. Refresh and try again.");
  }

  console.error("Transaction completion failed.", error.message ?? error.code ?? "Unknown database error");
  return failure("We could not complete that transaction. Please try again.");
}

async function getTransactionWriter() {
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

export async function revisePendingTransactionAction(
  previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  void previousState;

  const parsed = revisionSchema.safeParse({
    transactionId: formString(formData, "transactionId"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    mobileNumber: formString(formData, "mobileNumber"),
    email: formString(formData, "email"),
    vehicleCategoryId: formString(formData, "vehicleCategoryId"),
    plateNumber: formString(formData, "plateNumber"),
    make: formString(formData, "make"),
    model: formString(formData, "model"),
    color: formString(formData, "color"),
    serviceIds: jsonFormValue(formData, "serviceIds"),
    productLines: jsonFormValue(formData, "productLines"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const supabase = await getTransactionWriter();

  if (!supabase) {
    return failure("Only the active admin can manage transactions.");
  }

  const { error } = await supabase.rpc("revise_pending_transaction", {
    p_transaction_id: parsed.data.transactionId,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_mobile_number: parsed.data.mobileNumber,
    p_email: parsed.data.email,
    p_vehicle_category_id: parsed.data.vehicleCategoryId,
    p_plate_number: parsed.data.plateNumber,
    p_make: parsed.data.make,
    p_model: parsed.data.model,
    p_color: parsed.data.color,
    p_service_ids: parsed.data.serviceIds,
    p_product_lines: parsed.data.productLines as Json,
  });

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/transactions/${parsed.data.transactionId}`);
  return { status: "success", message: "Transaction changes saved.", fieldErrors: {} };
}

export async function confirmPendingTransactionAction(
  previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  void previousState;

  const parsed = transactionIdSchema.safeParse({
    transactionId: formString(formData, "transactionId"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const supabase = await getTransactionWriter();

  if (!supabase) {
    return failure("Only the active admin can manage transactions.");
  }

  const { error } = await supabase.rpc("confirm_pending_transaction", {
    p_transaction_id: parsed.data.transactionId,
  });

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/transactions/${parsed.data.transactionId}`);
  return { status: "success", message: "Transaction confirmed.", fieldErrors: {} };
}

export async function completeConfirmedTransactionAction(
  previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  void previousState;

  const parsed = transactionIdSchema.safeParse({
    transactionId: formString(formData, "transactionId"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const supabase = await getTransactionWriter();

  if (!supabase) {
    return failure("Only the active admin can manage transactions.");
  }

  const { error } = await supabase.rpc("complete_confirmed_transaction", {
    p_transaction_id: parsed.data.transactionId,
  });

  if (error) {
    return completionDatabaseFailure(error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/transactions/${parsed.data.transactionId}`);
  return { status: "success", message: "Transaction completed and inventory updated.", fieldErrors: {} };
}

export async function cancelTransactionAction(
  previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  void previousState;

  const parsed = cancellationSchema.safeParse({
    transactionId: formString(formData, "transactionId"),
    reason: formString(formData, "reason"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const supabase = await getTransactionWriter();

  if (!supabase) {
    return failure("Only the active admin can manage transactions.");
  }

  const { error } = await supabase.rpc("cancel_transaction", {
    p_transaction_id: parsed.data.transactionId,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/transactions/${parsed.data.transactionId}`);
  return { status: "success", message: "Transaction cancelled.", fieldErrors: {} };
}
