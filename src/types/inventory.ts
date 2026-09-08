export const inventoryItemTypes = ["consumable", "shop_product"] as const;
export type InventoryItemType = (typeof inventoryItemTypes)[number];

export const inventoryUnits = ["ml", "g", "piece"] as const;
export type InventoryUnit = (typeof inventoryUnits)[number];

export const inventoryMovementTypes = [
  "stock_in",
  "adjustment_in",
  "adjustment_out",
  "service_usage",
  "product_sale",
] as const;
export type InventoryMovementType = (typeof inventoryMovementTypes)[number];

export const manualInventoryMovementTypes = ["stock_in", "adjustment_in", "adjustment_out"] as const;

export const inventoryItemTypeLabels: Record<InventoryItemType, string> = {
  consumable: "Consumable",
  shop_product: "Shop product",
};

export const inventoryUnitLabels: Record<InventoryUnit, string> = {
  ml: "Millilitres (ml)",
  g: "Grams (g)",
  piece: "Pieces",
};

export const inventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  stock_in: "Stock in",
  adjustment_in: "Adjustment in",
  adjustment_out: "Adjustment out",
  service_usage: "Service usage",
  product_sale: "Product sale",
};
