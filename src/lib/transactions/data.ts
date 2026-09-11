import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminStaff } from "@/lib/staff/data";
import type { Database } from "@/types/database";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type VehicleRow = Database["public"]["Tables"]["customer_vehicles"]["Row"];
type CategoryRow = Database["public"]["Tables"]["vehicle_categories"]["Row"];
type ServiceLineRow = Database["public"]["Tables"]["transaction_services"]["Row"];
type ProductLineRow = Database["public"]["Tables"]["transaction_products"]["Row"];
type InventoryItemRow = Database["public"]["Tables"]["inventory_items"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ServicePriceRow = Database["public"]["Tables"]["service_prices"]["Row"];
type TransactionStaffRow = Database["public"]["Tables"]["transaction_staff"]["Row"];

export type TransactionStatus = TransactionRow["status"];

export type AdminTransactionService = {
  id: string;
  serviceId: string;
  name: string;
  sizeClass: ServiceLineRow["size_class_snapshot"];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminTransactionProduct = {
  id: string;
  inventoryItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminTransactionStaffAssignment = {
  staffId: string;
  name: string;
  mobileNumber: string | null;
  active: boolean;
  sharePercent: number;
  serviceSalesSnapshot: number | null;
  earningsSnapshot: number | null;
};

export type AdminTransactionCustomer = Pick<
  CustomerRow,
  "id" | "first_name" | "last_name" | "mobile_number" | "email"
>;

export type AdminTransactionVehicle = Pick<
  VehicleRow,
  "id" | "vehicle_category_id" | "plate_number" | "make" | "model" | "color"
> & {
  categoryName: string;
  sizeClass: CategoryRow["size_class"];
};

export type AdminTransaction = {
  id: string;
  transactionNumber: string;
  status: TransactionStatus;
  customerName: string;
  customer: AdminTransactionCustomer;
  vehicle: AdminTransactionVehicle;
  services: AdminTransactionService[];
  products: AdminTransactionProduct[];
  staffAssignments: AdminTransactionStaffAssignment[];
  serviceSubtotal: number;
  productSubtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
};

export type AdminTransactionCategory = Pick<CategoryRow, "id" | "name" | "size_class" | "sort_order">;
export type AdminTransactionCatalogService = Pick<ServiceRow, "id" | "name" | "description" | "sort_order">;
export type AdminTransactionCatalogPrice = Pick<ServicePriceRow, "service_id" | "size_class" | "price">;
export type AdminTransactionCatalogProduct = Pick<InventoryItemRow, "id" | "name" | "selling_price" | "sort_order"> & {
  selling_price: number;
};

export type AdminTransactionCatalog = {
  categories: AdminTransactionCategory[];
  services: AdminTransactionCatalogService[];
  servicePrices: AdminTransactionCatalogPrice[];
  products: AdminTransactionCatalogProduct[];
};

export type AdminTransactionDashboardData = {
  pendingCount: number;
  confirmedCount: number;
  pendingRequests: AdminTransaction[];
  confirmedRequests: AdminTransaction[];
  recentSubmissions: AdminTransaction[];
  recentPagination: AdminTransactionPagination;
};

export type AdminTransactionPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminTransactionReviewPageData = {
  transaction: AdminTransaction;
  catalog: AdminTransactionCatalog;
  staff: AdminStaff[];
};

export const dashboardRecentPageSize = 10;

const transactionSelect = [
  "id",
  "transaction_number",
  "customer_id",
  "vehicle_id",
  "customer_name_snapshot",
  "vehicle_category_name_snapshot",
  "plate_number_snapshot",
  "make_snapshot",
  "model_snapshot",
  "color_snapshot",
  "status",
  "service_subtotal",
  "product_subtotal",
  "total",
  "created_at",
  "updated_at",
  "confirmed_at",
  "cancelled_at",
  "cancellation_reason",
  "completed_at",
].join(", ");

function unique(values: string[]) {
  return [...new Set(values)];
}

async function getAdminClient() {
  await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

async function hydrateTransactions(
  supabase: Awaited<ReturnType<typeof getAdminClient>>,
  rows: TransactionRow[],
): Promise<AdminTransaction[]> {
  if (rows.length === 0) {
    return [];
  }

  const transactionIds = rows.map((row) => row.id);
  const customerIds = unique(rows.map((row) => row.customer_id));
  const vehicleIds = unique(rows.map((row) => row.vehicle_id));

  const [customersResult, vehiclesResult, serviceLinesResult, productLinesResult, staffAssignmentsResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, first_name, last_name, mobile_number, email")
      .in("id", customerIds),
    supabase
      .from("customer_vehicles")
      .select("id, vehicle_category_id, plate_number, make, model, color")
      .in("id", vehicleIds),
    supabase
      .from("transaction_services")
      .select("id, transaction_id, service_id, service_name_snapshot, size_class_snapshot, unit_price, quantity, line_total, line_order, created_at")
      .in("transaction_id", transactionIds)
      .order("line_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("transaction_products")
      .select("id, transaction_id, inventory_item_id, product_name_snapshot, unit_price, quantity, line_total, line_order, created_at")
      .in("transaction_id", transactionIds)
      .order("line_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("transaction_staff")
      .select("transaction_id, staff_id, share_percent, service_sales_snapshot, earnings_snapshot, created_at, updated_at")
      .in("transaction_id", transactionIds),
  ]);

  if (customersResult.error || vehiclesResult.error || serviceLinesResult.error || productLinesResult.error || staffAssignmentsResult.error) {
    throw new Error("Transaction details could not be loaded.");
  }

  const staffIds = unique((staffAssignmentsResult.data ?? []).map((assignment) => assignment.staff_id));
  const staffResult = staffIds.length > 0
    ? await supabase
      .from("staff")
      .select("id, name, mobile_number, active, created_at, updated_at")
      .in("id", staffIds)
    : { data: [], error: null };

  if (staffResult.error) {
    throw new Error("Staff assignment details could not be loaded.");
  }

  const categoryIds = unique((vehiclesResult.data ?? []).map((vehicle) => vehicle.vehicle_category_id));
  const categoriesResult = await supabase
    .from("vehicle_categories")
    .select("id, name, size_class, sort_order")
    .in("id", categoryIds);

  if (categoriesResult.error) {
    throw new Error("Vehicle category details could not be loaded.");
  }

  const customersById = new Map((customersResult.data ?? []).map((customer) => [customer.id, customer]));
  const vehiclesById = new Map((vehiclesResult.data ?? []).map((vehicle) => [vehicle.id, vehicle]));
  const categoriesById = new Map((categoriesResult.data ?? []).map((category) => [category.id, category]));
  const staffById = new Map((staffResult.data ?? []).map((staff) => [staff.id, staff]));
  const servicesByTransactionId = new Map<string, ServiceLineRow[]>();
  const productsByTransactionId = new Map<string, ProductLineRow[]>();
  const staffAssignmentsByTransactionId = new Map<string, TransactionStaffRow[]>();

  for (const line of serviceLinesResult.data ?? []) {
    const lines = servicesByTransactionId.get(line.transaction_id) ?? [];
    lines.push(line);
    servicesByTransactionId.set(line.transaction_id, lines);
  }

  for (const line of productLinesResult.data ?? []) {
    const lines = productsByTransactionId.get(line.transaction_id) ?? [];
    lines.push(line);
    productsByTransactionId.set(line.transaction_id, lines);
  }

  for (const assignment of staffAssignmentsResult.data ?? []) {
    const assignments = staffAssignmentsByTransactionId.get(assignment.transaction_id) ?? [];
    assignments.push(assignment);
    staffAssignmentsByTransactionId.set(assignment.transaction_id, assignments);
  }

  return rows.map((row) => {
    const customer = customersById.get(row.customer_id);
    const vehicle = vehiclesById.get(row.vehicle_id);
    const category = vehicle ? categoriesById.get(vehicle.vehicle_category_id) : undefined;

    if (!customer || !vehicle || !category) {
      throw new Error("Transaction relationship data is incomplete.");
    }

    const staffAssignments = (staffAssignmentsByTransactionId.get(row.id) ?? []).map((assignment) => {
      const staff = staffById.get(assignment.staff_id);

      if (!staff) {
        throw new Error("Staff assignment relationship data is incomplete.");
      }

      return {
        staffId: staff.id,
        name: staff.name,
        mobileNumber: staff.mobile_number,
        active: staff.active,
        sharePercent: assignment.share_percent,
        serviceSalesSnapshot: assignment.service_sales_snapshot,
        earningsSnapshot: assignment.earnings_snapshot,
      };
    });

    return {
      id: row.id,
      transactionNumber: row.transaction_number,
      status: row.status,
      customerName: row.customer_name_snapshot,
      customer,
      vehicle: {
        ...vehicle,
        categoryName: row.vehicle_category_name_snapshot,
        sizeClass: category.size_class,
      },
      services: (servicesByTransactionId.get(row.id) ?? []).map((line) => ({
        id: line.id,
        serviceId: line.service_id,
        name: line.service_name_snapshot,
        sizeClass: line.size_class_snapshot,
        unitPrice: line.unit_price,
        quantity: line.quantity,
        lineTotal: line.line_total,
      })),
      products: (productsByTransactionId.get(row.id) ?? []).map((line) => ({
        id: line.id,
        inventoryItemId: line.inventory_item_id,
        name: line.product_name_snapshot,
        unitPrice: line.unit_price,
        quantity: line.quantity,
        lineTotal: line.line_total,
      })),
      staffAssignments,
      serviceSubtotal: row.service_subtotal,
      productSubtotal: row.product_subtotal,
      total: row.total,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      confirmedAt: row.confirmed_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      completedAt: row.completed_at,
    };
  });
}

async function getAdminStaffOptions(
  supabase: Awaited<ReturnType<typeof getAdminClient>>,
): Promise<AdminStaff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, mobile_number, active, created_at, updated_at")
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Staff records could not be loaded.");
  }

  return data ?? [];
}

async function getAdminTransactionCatalog(
  supabase: Awaited<ReturnType<typeof getAdminClient>>,
): Promise<AdminTransactionCatalog> {
  const [categoriesResult, servicesResult, pricesResult, productsResult] = await Promise.all([
    supabase
      .from("vehicle_categories")
      .select("id, name, size_class, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, description, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("service_prices")
      .select("service_id, size_class, price")
      .eq("active", true),
    supabase
      .from("inventory_items")
      .select("id, name, selling_price, sort_order")
      .eq("item_type", "shop_product")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (categoriesResult.error || servicesResult.error || pricesResult.error || productsResult.error) {
    throw new Error("Transaction review catalog could not be loaded.");
  }

  const products = (productsResult.data ?? []).filter(
    (product): product is typeof product & { selling_price: number } => product.selling_price !== null,
  );

  return {
    categories: categoriesResult.data ?? [],
    services: servicesResult.data ?? [],
    servicePrices: pricesResult.data ?? [],
    products,
  };
}

function getPagination(totalItems: number, requestedPage: number, pageSize: number): AdminTransactionPagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    page: Math.min(Math.max(requestedPage, 1), totalPages),
    pageSize,
    totalItems,
    totalPages,
  };
}

function buildRecentSubmissionsQuery(supabase: Awaited<ReturnType<typeof getAdminClient>>) {
  return supabase
    .from("transactions")
    .select(transactionSelect, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
}

export async function getAdminTransactionDashboardData(requestedRecentPage = 1): Promise<AdminTransactionDashboardData> {
  const supabase = await getAdminClient();
  const recentPage = Number.isInteger(requestedRecentPage) && requestedRecentPage > 0 ? requestedRecentPage : 1;
  const recentOffset = (recentPage - 1) * dashboardRecentPageSize;
  const [pendingResult, confirmedResult, confirmedCountResult, recentResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(transactionSelect)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("transactions")
      .select(transactionSelect)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    buildRecentSubmissionsQuery(supabase).range(recentOffset, recentOffset + dashboardRecentPageSize - 1),
  ]);

  if (pendingResult.error || confirmedResult.error || confirmedCountResult.error || recentResult.error) {
    throw new Error("Transaction dashboard data could not be loaded.");
  }

  const pendingRows = (pendingResult.data ?? []) as unknown as TransactionRow[];
  const confirmedRows = (confirmedResult.data ?? []) as unknown as TransactionRow[];
  const recentPagination = getPagination(recentResult.count ?? 0, recentPage, dashboardRecentPageSize);
  let recentRows = (recentResult.data ?? []) as unknown as TransactionRow[];

  if (recentRows.length === 0 && recentPagination.totalItems > 0 && recentPagination.page !== recentPage) {
    const lastRecentOffset = (recentPagination.page - 1) * dashboardRecentPageSize;
    const lastRecentResult = await buildRecentSubmissionsQuery(supabase).range(lastRecentOffset, lastRecentOffset + dashboardRecentPageSize - 1);

    if (lastRecentResult.error) {
      throw new Error("Transaction dashboard data could not be loaded.");
    }

    recentRows = (lastRecentResult.data ?? []) as unknown as TransactionRow[];
  }
  const rowsById = new Map([...pendingRows, ...confirmedRows, ...recentRows].map((row) => [row.id, row]));
  const hydrated = await hydrateTransactions(supabase, [...rowsById.values()]);
  const hydratedById = new Map(hydrated.map((transaction) => [transaction.id, transaction]));

  return {
    pendingCount: pendingResult.data?.length === 50 ? await getPendingCount(supabase) : pendingResult.data?.length ?? 0,
    confirmedCount: confirmedCountResult.count ?? 0,
    pendingRequests: pendingRows.map((row) => hydratedById.get(row.id)).filter((transaction): transaction is AdminTransaction => Boolean(transaction)),
    confirmedRequests: confirmedRows.map((row) => hydratedById.get(row.id)).filter((transaction): transaction is AdminTransaction => Boolean(transaction)),
    recentSubmissions: recentRows.map((row) => hydratedById.get(row.id)).filter((transaction): transaction is AdminTransaction => Boolean(transaction)),
    recentPagination,
  };
}

async function getPendingCount(supabase: Awaited<ReturnType<typeof getAdminClient>>) {
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    throw new Error("Pending transaction count could not be loaded.");
  }

  return count ?? 0;
}

export async function getAdminTransactionReviewPageData(id: string): Promise<AdminTransactionReviewPageData | null> {
  const supabase = await getAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(transactionSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Transaction could not be loaded.");
  }

  if (!data) {
    return null;
  }

  const [transaction] = await hydrateTransactions(supabase, [data as unknown as TransactionRow]);

  return {
    transaction,
    catalog: await getAdminTransactionCatalog(supabase),
    staff: await getAdminStaffOptions(supabase),
  };
}
