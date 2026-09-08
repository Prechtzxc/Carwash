import { CatalogManager } from "@/components/catalog-manager";
import { getCatalogData } from "@/lib/catalog/data";
import { getInventoryRecipeData } from "@/lib/inventory/data";

export default async function CatalogPage() {
  const [{ categories, prices, services }, recipeData] = await Promise.all([
    getCatalogData(),
    getInventoryRecipeData(),
  ]);

  return <CatalogManager categories={categories} prices={prices} recipeData={recipeData} services={services} />;
}
