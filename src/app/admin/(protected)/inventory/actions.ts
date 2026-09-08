"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import type { FormActionState } from "@/lib/form-action-state";
import { createClient } from "@/lib/supabase/server";
import {
  inventoryItemTypes,
  inventoryUnits,
  manualInventoryMovementTypes,
} from "@/types/inventory";

export type InventoryActionState = FormActionState;

const decimalPattern = /^\d+(?:\.\d{1,3})?$/;
const moneyPattern = /^\d+(?:\.\d{1,2})?$/;

const nonNegativeQuantity = z
  .string()
  .trim()
  .regex(decimalPattern, "Use a non-negative amount with up to 3 decimals.")
  .transform(Number)
  .refine((value) => value < 100000000000, "Use an amount below 100,000,000,000.");

const positiveQuantity = nonNegativeQuantity.refine((value) => value > 0, "Use an amount greater than zero.");

const sortOrderField = z
  .string()
  .trim()
  .regex(/^\d+$/, "Use a whole number.")
  .transform(Number)
  .refine((value) => value <= 9999, "Use a number from 0 to 9,999.");

const inventoryItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Name is required.").max(120, "Name must be 120 characters or fewer."),
    itemType: z.enum(inventoryItemTypes),
    unit: z.enum(inventoryUnits),
    minimumStock: nonNegativeQuantity,
    sellingPrice: z
      .string()
      .trim()
      .refine((value) => value === "" || moneyPattern.test(value), "Use a non-negative PHP amount with up to 2 decimals."),
    description: z.string().trim().max(500, "Description must be 500 characters or fewer."),
    sortOrder: sortOrderField,
  })
  .refine((value) => value.itemType !== "shop_product" || value.sellingPrice !== "", {
    message: "A shop product requires a selling price.",
    path: ["sellingPrice"],
  })
  .refine((value) => value.itemType !== "consumable" || value.sellingPrice === "", {
    message: "Consumables do not use a selling price.",
    path: ["sellingPrice"],
  });

const toggleSchema = z.object({
  id: z.string().uuid("Record id is invalid."),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const movementSchema = z.object({
  inventoryItemId: z.string().uuid("Inventory item id is invalid."),
  movementType: z.enum(manualInventoryMovementTypes),
  quantity: positiveQuantity,
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
});

const requirementSchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid("Service id is invalid."),
  inventoryItemId: z.string().uuid("Inventory item id is invalid."),
  quantityRequired: positiveQuantity,
});

type DatabaseError = {
  code?: string;
  message?: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validationFailure(error: z.ZodError): InventoryActionState {
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

function failure(message: string, fieldErrors: Record<string, string> = {}): InventoryActionState {
  return { status: "error", message, fieldErrors };
}

function databaseFailure(error: DatabaseError): InventoryActionState {
  if (error.code === "23505") {
    return failure("That inventory item or service requirement already exists.");
  }

  if (error.code === "23514") {
    if (error.message?.includes("negative")) {
      return failure("That stock change would make the current stock negative.");
    }

    if (error.message?.includes("consumable")) {
      return failure("Service requirements may use consumable inventory items only.");
    }
  }

  if (error.code === "42501") {
    return failure("Only the active admin can change inventory.");
  }

  if (error.code === "23503") {
    return failure("The referenced inventory or service record no longer exists.");
  }

  console.error("Inventory mutation failed.", error.message ?? error.code ?? "Unknown database error");
  return failure("We could not save that inventory change. Please try again.");
}

function success(message: string): InventoryActionState {
  return { status: "success", message, fieldErrors: {} };
}

async function getInventoryWriter() {
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

export async function saveInventoryItemAction(
  previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  void previousState;

  const supabase = await getInventoryWriter();

  if (!supabase) {
    return failure("Only the active admin can change inventory.");
  }

  const parsed = inventoryItemSchema.safeParse({
    id: formString(formData, "id").trim() || undefined,
    name: formString(formData, "name"),
    itemType: formString(formData, "itemType"),
    unit: formString(formData, "unit"),
    minimumStock: formString(formData, "minimumStock"),
    sellingPrice: formString(formData, "sellingPrice"),
    description: formString(formData, "description"),
    sortOrder: formString(formData, "sortOrder"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const values = {
    name: parsed.data.name,
    item_type: parsed.data.itemType,
    unit: parsed.data.unit,
    minimum_stock: parsed.data.minimumStock,
    selling_price: parsed.data.itemType === "shop_product" ? Number(parsed.data.sellingPrice) : null,
    description: parsed.data.description || null,
    sort_order: parsed.data.sortOrder,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("inventory_items")
      .update(values)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return databaseFailure(error);
    }

    if (!data) {
      return failure("That inventory item no longer exists.");
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/catalog");
    return success("Inventory item updated.");
  }

  const { error } = await supabase.from("inventory_items").insert(values);

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/catalog");
  return success("Inventory item added.");
}

export async function toggleInventoryItemAction(
  previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  void previousState;

  const supabase = await getInventoryWriter();

  if (!supabase) {
    return failure("Only the active admin can change inventory.");
  }

  const parsed = toggleSchema.safeParse({
    id: formString(formData, "id"),
    active: formString(formData, "active"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { data, error } = await supabase
    .from("inventory_items")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseFailure(error);
  }

  if (!data) {
    return failure("That inventory item no longer exists.");
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/catalog");
  return success(parsed.data.active ? "Inventory item enabled." : "Inventory item disabled.");
}

export async function applyInventoryMovementAction(
  previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  void previousState;

  const supabase = await getInventoryWriter();

  if (!supabase) {
    return failure("Only the active admin can change inventory.");
  }

  const parsed = movementSchema.safeParse({
    inventoryItemId: formString(formData, "inventoryItemId"),
    movementType: formString(formData, "movementType"),
    quantity: formString(formData, "quantity"),
    notes: formString(formData, "notes"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { error } = await supabase.rpc("apply_inventory_movement", {
    p_inventory_item_id: parsed.data.inventoryItemId,
    p_movement_type: parsed.data.movementType,
    p_quantity: parsed.data.quantity,
    p_notes: parsed.data.notes || null,
  });

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin/inventory");
  return success("Stock movement recorded.");
}

export async function saveServiceInventoryRequirementAction(
  previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  void previousState;

  const supabase = await getInventoryWriter();

  if (!supabase) {
    return failure("Only the active admin can change inventory recipes.");
  }

  const parsed = requirementSchema.safeParse({
    id: formString(formData, "id").trim() || undefined,
    serviceId: formString(formData, "serviceId"),
    inventoryItemId: formString(formData, "inventoryItemId"),
    quantityRequired: formString(formData, "quantityRequired"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("id, item_type, active")
    .eq("id", parsed.data.inventoryItemId)
    .maybeSingle();

  if (itemError) {
    return databaseFailure(itemError);
  }

  if (!item || item.item_type !== "consumable") {
    return failure("Select a consumable inventory item.", { inventoryItemId: "Only consumables can be used by services." });
  }

  const values = {
    service_id: parsed.data.serviceId,
    inventory_item_id: parsed.data.inventoryItemId,
    quantity_required: parsed.data.quantityRequired,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("service_inventory_requirements")
      .update(values)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return databaseFailure(error);
    }

    if (!data) {
      return failure("That service requirement no longer exists.");
    }

    revalidatePath("/admin/catalog");
    return success("Service requirement updated.");
  }

  const { error } = await supabase.from("service_inventory_requirements").insert(values);

  if (error) {
    return databaseFailure(error);
  }

  revalidatePath("/admin/catalog");
  return success("Service requirement added.");
}

export async function removeServiceInventoryRequirementAction(
  previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  void previousState;

  const supabase = await getInventoryWriter();

  if (!supabase) {
    return failure("Only the active admin can change inventory recipes.");
  }

  const parsed = z.object({ id: z.string().uuid("Requirement id is invalid.") }).safeParse({
    id: formString(formData, "id"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { data, error } = await supabase
    .from("service_inventory_requirements")
    .delete()
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseFailure(error);
  }

  if (!data) {
    return failure("That service requirement no longer exists.");
  }

  revalidatePath("/admin/catalog");
  return success("Service requirement removed.");
}
