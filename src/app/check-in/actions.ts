"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { CheckInActionState } from "@/lib/check-in/state";
import type { Json } from "@/types/database";

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
  quantity: z
    .coerce
    .number()
    .finite()
    .int("Product quantity must be a whole number.")
    .positive("Product quantity must be greater than zero.")
    .max(99, "Product quantity cannot exceed 99.")
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8, "Use no more than 3 decimal places."),
});

const submissionSchema = z.object({
  idempotencyKey: z.string().uuid("Submission key is invalid."),
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

const moneySchema = z.coerce.number().finite().nonnegative();
const checkInResultSchema = z.object({
  transactionNumber: z.string().regex(/^CW-\d{8}-\d+$/),
  customerName: z.string().min(1),
  vehicleCategoryName: z.string().min(1),
  vehicleDetails: z.object({
    plateNumber: z.string().nullable(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    color: z.string().nullable(),
  }),
  serviceSubtotal: moneySchema,
  productSubtotal: moneySchema,
  total: moneySchema,
  services: z.array(z.object({
    name: z.string().min(1),
    unitPrice: moneySchema,
    quantity: z.coerce.number().int().positive(),
    lineTotal: moneySchema,
  })),
  products: z.array(z.object({
    name: z.string().min(1),
    unitPrice: moneySchema,
    quantity: z.coerce.number().positive(),
    lineTotal: moneySchema,
  })),
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

function validationFailure(error: z.ZodError): CheckInActionState {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    status: "error",
    message: "Check the highlighted details before submitting.",
    fieldErrors,
    result: null,
  };
}

function failure(message: string, fieldErrors: Record<string, string> = {}): CheckInActionState {
  return { status: "error", message, fieldErrors, result: null };
}

function databaseFailure(error: DatabaseError): CheckInActionState {
  if (error.message?.includes("too large")) {
    return failure("The estimated total is too large to submit.");
  }

  if (error.code === "22023") {
    return failure("Some selections are no longer available. Refresh the page and try again.");
  }

  console.error("Public check-in submission failed.", error.code ?? "Unknown database error");
  return failure("We could not submit your request. Please try again.");
}

export async function submitPublicCheckInAction(
  previousState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  void previousState;

  const parsed = submissionSchema.safeParse({
    idempotencyKey: formString(formData, "idempotencyKey"),
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

  const supabase = await createClient();

  if (!supabase) {
    return failure("Check-in is temporarily unavailable. Please try again later.");
  }

  const { data, error } = await supabase.rpc("submit_public_check_in", {
    p_idempotency_key: parsed.data.idempotencyKey,
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

  const result = checkInResultSchema.safeParse(data);

  if (!result.success) {
    console.error("Public check-in returned an invalid result.");
    return failure("We could not confirm your request. Please try again.");
  }

  return {
    status: "success",
    message: "Your request has been submitted.",
    fieldErrors: {},
    result: result.data,
  };
}
