"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { vehicleSizes } from "@/types/catalog";

export type CatalogActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
};

export const initialCatalogActionState: CatalogActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const sortOrderField = z
  .string()
  .trim()
  .regex(/^\d+$/, "Use a whole number.")
  .transform(Number)
  .refine((value) => value <= 9999, "Use a number from 0 to 9,999.");

const priceField = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Use a non-negative amount with up to 2 decimals.")
  .transform(Number)
  .refine((value) => value <= 99999999.99, "Use an amount below 100,000,000.");

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(80, "Name must be 80 characters or fewer."),
  description: z.string().trim().max(240, "Description must be 240 characters or fewer."),
  sizeClass: z.enum(vehicleSizes),
  sortOrder: sortOrderField,
});

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(80, "Name must be 80 characters or fewer."),
  description: z.string().trim().max(240, "Description must be 240 characters or fewer."),
  sortOrder: sortOrderField,
});

const toggleSchema = z.object({
  id: z.string().uuid("Record id is invalid."),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const priceSchema = z.object({
  serviceId: z.string().uuid("Service id is invalid."),
  sizeClass: z.enum(vehicleSizes),
  price: priceField,
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

function validationFailure(error: z.ZodError): CatalogActionState {
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

function failure(message: string, fieldErrors: Record<string, string> = {}): CatalogActionState {
  return { status: "error", message, fieldErrors };
}

function databaseFailure(error: DatabaseError): CatalogActionState {
  if (error.code === "23505") {
    return failure("A record with that name already exists.");
  }

  console.error("Catalog mutation failed.", error.message ?? error.code ?? "Unknown database error");
  return failure("We could not save that change. Please try again.");
}

function success(message: string): CatalogActionState {
  return { status: "success", message, fieldErrors: {} };
}

async function getCatalogWriter() {
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

export async function saveVehicleCategoryAction(
  previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  void previousState;

  const supabase = await getCatalogWriter();

  if (!supabase) {
    return failure("Only active admins can change catalog settings.");
  }

  const parsed = categorySchema.safeParse({
    id: formString(formData, "id").trim() || undefined,
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    sizeClass: formString(formData, "sizeClass"),
    sortOrder: formString(formData, "sortOrder"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const values = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    size_class: parsed.data.sizeClass,
    sort_order: parsed.data.sortOrder,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("vehicle_categories")
      .update(values)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return databaseFailure(error);
    }

    if (!data) {
      return failure("That vehicle category no longer exists.");
    }

    revalidatePath("/admin/catalog");
    return success("Vehicle category updated.");
  }

  const { error } = await supabase.from("vehicle_categories").insert(values);

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin/catalog");
  return success("Vehicle category added.");
}

export async function toggleVehicleCategoryAction(
  previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  void previousState;

  const supabase = await getCatalogWriter();

  if (!supabase) {
    return failure("Only active admins can change catalog settings.");
  }

  const parsed = toggleSchema.safeParse({
    id: formString(formData, "id"),
    active: formString(formData, "active"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { data, error } = await supabase
    .from("vehicle_categories")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseFailure(error);
  }

  if (!data) {
    return failure("That vehicle category no longer exists.");
  }

  revalidatePath("/admin/catalog");
  return success(parsed.data.active ? "Vehicle category enabled." : "Vehicle category disabled.");
}

export async function saveServiceAction(
  previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  void previousState;

  const supabase = await getCatalogWriter();

  if (!supabase) {
    return failure("Only active admins can change catalog settings.");
  }

  const parsed = serviceSchema.safeParse({
    id: formString(formData, "id").trim() || undefined,
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    sortOrder: formString(formData, "sortOrder"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const values = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    sort_order: parsed.data.sortOrder,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("services")
      .update(values)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return databaseFailure(error);
    }

    if (!data) {
      return failure("That service no longer exists.");
    }

    revalidatePath("/admin/catalog");
    return success("Service updated.");
  }

  const { error } = await supabase.from("services").insert(values);

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin/catalog");
  return success("Service added.");
}

export async function toggleServiceAction(
  previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  void previousState;

  const supabase = await getCatalogWriter();

  if (!supabase) {
    return failure("Only active admins can change catalog settings.");
  }

  const parsed = toggleSchema.safeParse({
    id: formString(formData, "id"),
    active: formString(formData, "active"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { data, error } = await supabase
    .from("services")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseFailure(error);
  }

  if (!data) {
    return failure("That service no longer exists.");
  }

  revalidatePath("/admin/catalog");
  return success(parsed.data.active ? "Service enabled." : "Service disabled.");
}

export async function saveServicePriceAction(
  previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  void previousState;

  const supabase = await getCatalogWriter();

  if (!supabase) {
    return failure("Only active admins can change catalog settings.");
  }

  const parsed = priceSchema.safeParse({
    serviceId: formString(formData, "serviceId"),
    sizeClass: formString(formData, "sizeClass"),
    price: formString(formData, "price"),
    active: formString(formData, "active"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { error } = await supabase.from("service_prices").upsert(
    {
      service_id: parsed.data.serviceId,
      size_class: parsed.data.sizeClass,
      price: parsed.data.price,
      active: parsed.data.active,
    },
    { onConflict: "service_id,size_class" },
  );

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin/catalog");
  return success("Price saved.");
}
