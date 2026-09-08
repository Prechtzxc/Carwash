import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { PublicCheckInCatalog } from "@/types/check-in";

const publicCheckInCatalogSchema = z.object({
  vehicleCategories: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
  })),
  services: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
    description: z.string().nullable(),
  })),
  servicePrices: z.array(z.object({
    serviceId: z.string().uuid(),
    vehicleCategoryId: z.string().uuid(),
    price: z.coerce.number().finite().nonnegative(),
  })),
  shopProducts: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    description: z.string().nullable().optional().transform((value) => value ?? null),
    sellingPrice: z.coerce.number().finite().nonnegative(),
  })),
});

export async function getPublicCheckInCatalog(): Promise<PublicCheckInCatalog> {
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("get_public_check_in_catalog", {});

  if (error) {
    throw new Error("Public check-in catalog could not be loaded.");
  }

  const parsed = publicCheckInCatalogSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Public check-in catalog could not be loaded.");
  }

  return parsed.data;
}
