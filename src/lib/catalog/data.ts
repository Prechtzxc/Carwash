import { requireAdminProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/auth";
import type { Database } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["vehicle_categories"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type PriceRow = Database["public"]["Tables"]["service_prices"]["Row"];

export type VehicleCategoryDto = Pick<CategoryRow, "id" | "name" | "description" | "size_class" | "active" | "sort_order">;
export type ServiceDto = Pick<ServiceRow, "id" | "name" | "description" | "active" | "sort_order">;
export type ServicePriceDto = Pick<PriceRow, "id" | "service_id" | "size_class" | "price" | "active">;

export type CatalogData = {
  role: AppRole;
  categories: VehicleCategoryDto[];
  services: ServiceDto[];
  prices: ServicePriceDto[];
};

export async function getCatalogData(): Promise<CatalogData> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const [categoriesResult, servicesResult, pricesResult] = await Promise.all([
    supabase
      .from("vehicle_categories")
      .select("id, name, description, size_class, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, description, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("service_prices")
      .select("id, service_id, size_class, price, active")
      .order("size_class", { ascending: true }),
  ]);

  if (categoriesResult.error || servicesResult.error || pricesResult.error) {
    throw new Error("Catalog data could not be loaded.");
  }

  return {
    role: profile.role,
    categories: categoriesResult.data ?? [],
    services: servicesResult.data ?? [],
    prices: pricesResult.data ?? [],
  };
}
