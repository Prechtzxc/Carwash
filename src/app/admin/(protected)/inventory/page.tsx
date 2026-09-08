import { InventoryManager } from "@/components/inventory-manager";
import { getInventoryData } from "@/lib/inventory/data";

export default async function InventoryPage() {
  const { items, movements } = await getInventoryData();

  return <InventoryManager items={items} movements={movements} />;
}
