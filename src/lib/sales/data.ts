import { z } from "zod";

import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const salesLineSchema = z.object({
  name: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  lineTotal: z.number(),
});

const salesReportSchema = z.object({
  summary: z.object({
    totalSales: z.number(),
    salesToday: z.number(),
    salesThisMonth: z.number(),
    completedTransactions: z.number().int().nonnegative(),
  }),
  filtered: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    sales: z.number(),
    completedTransactions: z.number().int().nonnegative(),
    averageTransactionValue: z.number(),
  }),
  serviceSales: z.array(z.object({ name: z.string(), total: z.number() })),
  productSales: z.array(z.object({ name: z.string(), total: z.number() })),
  vehicleCategories: z.array(z.object({ name: z.string(), transactions: z.number().int().nonnegative() })),
  trend: z.array(z.object({ date: z.string(), total: z.number() })),
  transactions: z.array(z.object({
    id: z.string().uuid(),
    transactionNumber: z.string(),
    completedAt: z.string(),
    customerName: z.string(),
    vehicleCategory: z.string(),
    plateNumber: z.string().nullable(),
    services: z.array(salesLineSchema),
    products: z.array(salesLineSchema),
    total: z.number(),
  })),
});

export type SalesReport = z.infer<typeof salesReportSchema>;

export const salesFilterKeys = ["today", "week", "month", "all", "custom"] as const;
export type SalesFilterKey = (typeof salesFilterKeys)[number];

export type SalesFilterSelection = {
  key: SalesFilterKey;
  label: string;
  startDate: string | null;
  endDate: string | null;
  fromValue: string;
  toValue: string;
  error: string | null;
};

export async function getAdminSalesReport(startDate: string | null, endDate: string | null): Promise<SalesReport> {
  await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("get_admin_sales_report", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error || !data) {
    throw new Error("Sales report data could not be loaded.");
  }

  const parsed = salesReportSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Sales report response was invalid.", parsed.error.message);
    throw new Error("Sales report data could not be loaded.");
  }

  return parsed.data;
}
