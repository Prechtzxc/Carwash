import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { ServiceDto } from "@/lib/catalog/data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  InventoryItemType,
  InventoryMovementType,
  InventoryStockStatus,
} from "@/types/inventory";

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
  | "stock_status"
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
  | "created_by"
  | "created_at"
> & {
  reference_label: string | null;
};

export type InventoryItemOptionDto = Pick<InventoryItemRow, "id" | "name" | "unit" | "active">;

export type ServiceInventoryRequirementDto = Pick<
  RequirementRow,
  "id" | "service_id" | "inventory_item_id" | "quantity_required"
>;

export type InventoryData = {
  items: InventoryItemDto[];
  movements: InventoryMovementDto[];
  itemOptions: InventoryItemOptionDto[];
  summary: InventorySummary;
  itemPagination: InventoryPagination;
  movementPagination: InventoryPagination;
  filters: InventoryFilters;
};

export type InventorySummary = {
  totalActiveItems: number;
  lowStockItems: number;
  outOfStockItems: number;
};

export type InventoryPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type InventoryFilters = {
  search: string;
  itemType: InventoryItemType | "all";
  status: InventoryStockStatus | "all";
  page: number;
  movementItemId: string;
  movementType: InventoryMovementType | "";
  movementFrom: string;
  movementTo: string;
  movementDateError: string | null;
  movementPage: number;
};

export const inventoryPageSize = 20;
export const inventoryMovementPageSize = 25;

export const defaultInventoryFilters: InventoryFilters = {
  search: "",
  itemType: "all",
  status: "all",
  page: 1,
  movementItemId: "",
  movementType: "",
  movementFrom: "",
  movementTo: "",
  movementDateError: null,
  movementPage: 1,
};

export type InventoryRecipeData = {
  services: ServiceDto[];
  consumables: InventoryItemDto[];
  requirements: ServiceInventoryRequirementDto[];
};

type AdminSupabaseClient = SupabaseClient<Database>;

type InventoryItemSelect = Pick<
  InventoryItemRow,
  | "id"
  | "name"
  | "item_type"
  | "unit"
  | "current_stock"
  | "minimum_stock"
  | "stock_status"
  | "selling_price"
  | "description"
  | "active"
  | "sort_order"
>;

type InventoryMovementSelect = Pick<
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
  | "created_by"
  | "created_at"
>;

async function getAdminClient(): Promise<AdminSupabaseClient> {
  await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function manilaDateStart(value: string) {
  return new Date(`${value}T00:00:00.000+08:00`).toISOString();
}

function nextManilaDate(value: string) {
  const date = new Date(`${value}T00:00:00.000+08:00`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function buildItemQuery(supabase: AdminSupabaseClient, filters: InventoryFilters) {
  let query = supabase
    .from("inventory_items")
    .select("id, name, item_type, unit, current_stock, minimum_stock, stock_status, selling_price, description, active, sort_order", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters.itemType !== "all") {
    query = query.eq("item_type", filters.itemType);
  }

  if (filters.status !== "all") {
    query = query.eq("stock_status", filters.status);
  }

  return query;
}

function buildMovementQuery(supabase: AdminSupabaseClient, filters: InventoryFilters) {
  let query = supabase
    .from("inventory_movements")
    .select("id, inventory_item_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, notes, created_by, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (filters.movementItemId) {
    query = query.eq("inventory_item_id", filters.movementItemId);
  }

  if (filters.movementType) {
    query = query.eq("movement_type", filters.movementType);
  }

  if (filters.movementFrom) {
    query = query.gte("created_at", manilaDateStart(filters.movementFrom));
  }

  if (filters.movementTo) {
    query = query.lt("created_at", nextManilaDate(filters.movementTo));
  }

  return query;
}

function getPagination(totalItems: number, requestedPage: number, pageSize: number): InventoryPagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    page: Math.min(Math.max(requestedPage, 1), totalPages),
    pageSize,
    totalItems,
    totalPages,
  };
}

async function addMovementReferences(
  supabase: AdminSupabaseClient,
  movements: InventoryMovementSelect[],
): Promise<InventoryMovementDto[]> {
  const transactionIds = Array.from(new Set(
    movements
      .filter((movement) => movement.reference_type === "transaction" && movement.reference_id)
      .map((movement) => movement.reference_id as string),
  ));
  const transactionNumbers = new Map<string, string>();

  if (transactionIds.length > 0) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, transaction_number")
      .in("id", transactionIds);

    if (error) {
      throw new Error("Inventory movement references could not be loaded.");
    }

    for (const transaction of data ?? []) {
      transactionNumbers.set(transaction.id, transaction.transaction_number);
    }
  }

  return movements.map((movement) => ({
    ...movement,
    reference_label: movement.reference_type === "transaction"
      ? transactionNumbers.has(movement.reference_id ?? "")
        ? `Transaction ${transactionNumbers.get(movement.reference_id ?? "")}`
        : "Transaction reference unavailable"
      : null,
  }));
}

export async function getInventoryData(
  requestedFilters: InventoryFilters = defaultInventoryFilters,
): Promise<InventoryData> {
  const supabase = await getAdminClient();
  const filters = { ...defaultInventoryFilters, ...requestedFilters };
  const itemOffset = (Math.max(filters.page, 1) - 1) * inventoryPageSize;
  const movementOffset = (Math.max(filters.movementPage, 1) - 1) * inventoryMovementPageSize;

  const [itemsResult, movementsResult, itemOptionsResult, totalActiveResult, lowStockResult, outOfStockResult] = await Promise.all([
    buildItemQuery(supabase, filters).range(itemOffset, itemOffset + inventoryPageSize - 1),
    buildMovementQuery(supabase, filters).range(movementOffset, movementOffset + inventoryMovementPageSize - 1),
    supabase
      .from("inventory_items")
      .select("id, name, unit, active")
      .order("name", { ascending: true }),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("stock_status", "low_stock"),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("stock_status", "out_of_stock"),
  ]);

  if (
    itemsResult.error
    || movementsResult.error
    || itemOptionsResult.error
    || totalActiveResult.error
    || lowStockResult.error
    || outOfStockResult.error
  ) {
    throw new Error("Inventory data could not be loaded.");
  }

  const itemPagination = getPagination(itemsResult.count ?? 0, filters.page, inventoryPageSize);
  const movementPagination = getPagination(movementsResult.count ?? 0, filters.movementPage, inventoryMovementPageSize);
  let items = (itemsResult.data ?? []) as InventoryItemSelect[];
  let movements = (movementsResult.data ?? []) as InventoryMovementSelect[];

  if (items.length === 0 && itemPagination.totalItems > 0 && itemPagination.page !== filters.page) {
    const lastItemOffset = (itemPagination.page - 1) * inventoryPageSize;
    const lastItemsResult = await buildItemQuery(supabase, filters).range(lastItemOffset, lastItemOffset + inventoryPageSize - 1);

    if (lastItemsResult.error) {
      throw new Error("Inventory data could not be loaded.");
    }

    items = (lastItemsResult.data ?? []) as InventoryItemSelect[];
  }

  if (movements.length === 0 && movementPagination.totalItems > 0 && movementPagination.page !== filters.movementPage) {
    const lastMovementOffset = (movementPagination.page - 1) * inventoryMovementPageSize;
    const lastMovementsResult = await buildMovementQuery(supabase, filters).range(lastMovementOffset, lastMovementOffset + inventoryMovementPageSize - 1);

    if (lastMovementsResult.error) {
      throw new Error("Inventory data could not be loaded.");
    }

    movements = (lastMovementsResult.data ?? []) as InventoryMovementSelect[];
  }

  return {
    items,
    movements: await addMovementReferences(supabase, movements),
    itemOptions: itemOptionsResult.data ?? [],
    summary: {
      totalActiveItems: totalActiveResult.count ?? 0,
      lowStockItems: lowStockResult.count ?? 0,
      outOfStockItems: outOfStockResult.count ?? 0,
    },
    itemPagination,
    movementPagination,
    filters: {
      ...filters,
      page: itemPagination.page,
      movementPage: movementPagination.page,
    },
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
      .select("id, name, item_type, unit, current_stock, minimum_stock, stock_status, selling_price, description, active, sort_order")
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
