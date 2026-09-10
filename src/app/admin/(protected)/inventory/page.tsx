import { InventoryManager } from "@/components/inventory-manager";
import {
  defaultInventoryFilters,
  getInventoryData,
  type InventoryFilters,
} from "@/lib/inventory/data";
import {
  inventoryItemTypes,
  inventoryMovementTypes,
  inventoryStockStatuses,
} from "@/types/inventory";

type InventorySearchParams = Promise<Record<string, string | string[] | undefined>>;

function searchParamValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function boundedPage(value: string) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, 100000);
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveFilters(searchParams: Record<string, string | string[] | undefined>): InventoryFilters {
  const requestedItemType = searchParamValue(searchParams, "type");
  const requestedStatus = searchParamValue(searchParams, "status");
  const requestedMovementType = searchParamValue(searchParams, "movementType");
  const movementFrom = searchParamValue(searchParams, "movementFrom");
  const movementTo = searchParamValue(searchParams, "movementTo");
  const movementFromIsValid = !movementFrom || isIsoDate(movementFrom);
  const movementToIsValid = !movementTo || isIsoDate(movementTo);
  const normalizedMovementFrom = isIsoDate(movementFrom) ? movementFrom : "";
  const normalizedMovementTo = isIsoDate(movementTo) ? movementTo : "";
  const datesAreOrdered = !normalizedMovementFrom || !normalizedMovementTo || normalizedMovementFrom <= normalizedMovementTo;
  const movementDateError = !movementFromIsValid || !movementToIsValid
    ? "Enter valid movement dates."
    : datesAreOrdered
      ? null
      : "The movement start date cannot be after the end date.";
  const hasInvalidMovementDate = !movementFromIsValid || !movementToIsValid;

  return {
    ...defaultInventoryFilters,
    search: searchParamValue(searchParams, "search").trim().slice(0, 80),
    itemType: (inventoryItemTypes as readonly string[]).includes(requestedItemType)
      ? requestedItemType as InventoryFilters["itemType"]
      : "all",
    status: (inventoryStockStatuses as readonly string[]).includes(requestedStatus)
      ? requestedStatus as InventoryFilters["status"]
      : "all",
    page: boundedPage(searchParamValue(searchParams, "page")),
    movementItemId: isUuid(searchParamValue(searchParams, "movementItem")) ? searchParamValue(searchParams, "movementItem") : "",
    movementType: (inventoryMovementTypes as readonly string[]).includes(requestedMovementType)
      ? requestedMovementType as InventoryFilters["movementType"]
      : "",
    movementFrom: hasInvalidMovementDate ? "" : normalizedMovementFrom,
    movementTo: hasInvalidMovementDate ? "" : normalizedMovementTo,
    movementDateError,
    movementPage: boundedPage(searchParamValue(searchParams, "movementPage")),
  };
}

export default async function InventoryPage({ searchParams }: { searchParams: InventorySearchParams }) {
  const data = await getInventoryData(resolveFilters(await searchParams));

  return <InventoryManager {...data} />;
}
