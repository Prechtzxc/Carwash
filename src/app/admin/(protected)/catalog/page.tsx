import { CatalogManager } from "@/components/catalog-manager";
import { getCatalogData } from "@/lib/catalog/data";

export default async function CatalogPage() {
  const { categories, prices, role, services } = await getCatalogData();

  return <CatalogManager categories={categories} prices={prices} role={role} services={services} />;
}
