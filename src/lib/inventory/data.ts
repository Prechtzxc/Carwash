import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { ServiceDto } from "@/lib/catalog/data";
import type { Database } from "@/types/database";

type InventoryItemRow = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryMovementRow = Database["public"]["Tables"]["inventory_movements"]["Row"];
type RequirementRow = Database["public"]["Tables"]["service_inventory_requirements"]["Row"];

export type InventoryItemDto = Pick<
  InventoryItemRow,
  | "id"
  | "name"
  | "item_type"
  | "unit"
  | "current_stock"
  | "minimum_stock"
  | "selling_price"
  | "description"
  | "active"
  | "sort_order"
>;

export type InventoryMovementDto = Pick<
  InventoryMovementRow,
  | "id"
  | "inventory_item_id"
  | "movement_type"
  | "quantity"
  | "stock_before"
   | "stock_after"
   | "reference_type"
   | "reference_id"
   | "notes"
   | "created_at"
>;

export type ServiceInventoryRequirementDto = Pick<
  RequirementRow,
  "id" | "service_id" | "inventory_item_id" | "quantity_required"
>;

export type InventoryData = {
  items: InventoryItemDto[];
  movements: InventoryMovementDto[];
};

export type InventoryRecipeData = {
  services: ServiceDto[];
  consumables: InventoryItemDto[];
  requirements: ServiceInventoryRequirementDto[];
};

async function getAdminClient() {
  await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function getInventoryData(): Promise<InventoryData> {
  const supabase = await getAdminClient();

  const [itemsResult, movementsResult] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, item_type, unit, current_stock, minimum_stock, selling_price, description, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("inventory_movements")
       .select("id, inventory_item_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (itemsResult.error || movementsResult.error) {
    throw new Error("Inventory data could not be loaded.");
  }

  return {
    items: itemsResult.data ?? [],
    movements: movementsResult.data ?? [],
  };
}

export async function getInventoryRecipeData(): Promise<InventoryRecipeData> {
  const supabase = await getAdminClient();

  const [servicesResult, consumablesResult, requirementsResult] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("inventory_items")
      .select("id, name, item_type, unit, current_stock, minimum_stock, selling_price, description, active, sort_order")
      .eq("item_type", "consumable")
      .order("active", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("service_inventory_requirements")
      .select("id, service_id, inventory_item_id, quantity_required"),
  ]);

  if (servicesResult.error || consumablesResult.error || requirementsResult.error) {
    throw new Error("Service consumable requirements could not be loaded.");
  }

  return {
    services: servicesResult.data ?? [],
    consumables: consumablesResult.data ?? [],
    requirements: requirementsResult.data ?? [],
  };
}
