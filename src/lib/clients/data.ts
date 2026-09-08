import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const directoryCustomerSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string(),
  mobileNumber: z.string(),
  email: z.string().nullable(),
  vehicleCount: z.number().int().nonnegative(),
  completedVisits: z.number().int().nonnegative(),
  lastCompletedVisit: z.string().nullable(),
  totalTransactionAmount: z.number(),
  createdAt: z.string(),
});

const directoryReportSchema = z.object({
  summary: z.object({
    totalCustomers: z.number().int().nonnegative(),
    returningCustomers: z.number().int().nonnegative(),
  }),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalMatches: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  customers: z.array(directoryCustomerSchema),
});

const customerLineSchema = z.object({
  name: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  lineTotal: z.number(),
});

const clientDetailSchema = z.object({
  customer: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    mobileNumber: z.string(),
    email: z.string().nullable(),
    createdAt: z.string(),
  }),
  summary: z.object({
    completedVisits: z.number().int().nonnegative(),
    lastCompletedVisit: z.string().nullable(),
    totalTransactionAmount: z.number(),
  }),
  vehicles: z.array(z.object({
    id: z.string().uuid(),
    vehicleCategoryId: z.string().uuid(),
    vehicleCategoryName: z.string(),
    vehicleCategoryActive: z.boolean(),
    plateNumber: z.string().nullable(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    color: z.string().nullable(),
    createdAt: z.string(),
    completedVisits: z.number().int().nonnegative(),
    lastCompletedVisit: z.string().nullable(),
  })),
  transactions: z.array(z.object({
    id: z.string().uuid(),
    transactionNumber: z.string(),
    completedAt: z.string(),
    vehicle: z.object({
      categoryName: z.string(),
      plateNumber: z.string().nullable(),
      make: z.string().nullable(),
      model: z.string().nullable(),
      color: z.string().nullable(),
    }),
    services: z.array(customerLineSchema),
    products: z.array(customerLineSchema),
    total: z.number(),
  })),
  vehicleCategories: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    active: z.boolean(),
  })),
});

export type ClientDirectoryReport = z.infer<typeof directoryReportSchema>;
export type ClientDetail = z.infer<typeof clientDetailSchema>;

export const clientSortKeys = ["recent", "name", "visits", "last_visit"] as const;
export type ClientSortKey = (typeof clientSortKeys)[number];

async function getAdminClient() {
  await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function getAdminClientDirectory({
  search,
  page,
  sort,
}: {
  search: string;
  page: number;
  sort: ClientSortKey;
}): Promise<ClientDirectoryReport> {
  const supabase = await getAdminClient();
  const { data, error } = await supabase.rpc("get_admin_client_directory", {
    p_search: search || null,
    p_page: page,
    p_page_size: 20,
    p_sort: sort,
  });

  if (error || !data) {
    throw new Error("Client directory data could not be loaded.");
  }

  const parsed = directoryReportSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Client directory response was invalid.", parsed.error.message);
    throw new Error("Client directory data could not be loaded.");
  }

  return parsed.data;
}

export async function getAdminClientDetail(id: string): Promise<ClientDetail | null> {
  const supabase = await getAdminClient();
  const { data, error } = await supabase.rpc("get_admin_client_detail", {
    p_customer_id: id,
  });

  if (error) {
    if (error.code === "22023" && error.message?.includes("no longer exists")) {
      return null;
    }

    throw new Error("Customer details could not be loaded.");
  }

  if (!data) {
    return null;
  }

  const parsed = clientDetailSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Customer detail response was invalid.", parsed.error.message);
    throw new Error("Customer details could not be loaded.");
  }

  return parsed.data;
}
