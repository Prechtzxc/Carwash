import { AdminSalesDashboard } from "@/components/admin-sales-dashboard";
import {
  getAdminSalesReport,
  salesFilterKeys,
  type SalesFilterKey,
  type SalesFilterSelection,
} from "@/lib/sales/data";

type SalesSearchParams = Promise<Record<string, string | string[] | undefined>>;

function searchParamValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isSalesFilterKey(value: string): value is SalesFilterKey {
  return (salesFilterKeys as readonly string[]).includes(value);
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function resolvePage(value: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function manilaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function resolveSelection(searchParams: Record<string, string | string[] | undefined>): SalesFilterSelection {
  const requestedKey = searchParamValue(searchParams, "range");
  const key = isSalesFilterKey(requestedKey) ? requestedKey : "all";
  const today = manilaToday();

  if (key === "custom") {
    const fromValue = searchParamValue(searchParams, "from");
    const toValue = searchParamValue(searchParams, "to");

    if (!isIsoDate(fromValue) || !isIsoDate(toValue)) {
      return {
        key,
        label: "Custom date range",
        startDate: null,
        endDate: null,
        fromValue,
        toValue,
        error: "Choose a valid start and end date for the custom range.",
      };
    }

    if (fromValue > toValue) {
      return {
        key,
        label: "Custom date range",
        startDate: null,
        endDate: null,
        fromValue,
        toValue,
        error: "The start date cannot be after the end date.",
      };
    }

    return {
      key,
      label: `${fromValue} to ${toValue}`,
      startDate: fromValue,
      endDate: toValue,
      fromValue,
      toValue,
      error: null,
    };
  }

  if (key === "today") {
    return { key, label: "Today", startDate: today, endDate: today, fromValue: "", toValue: "", error: null };
  }

  if (key === "week") {
    const dayOfWeek = new Date(`${today}T00:00:00.000Z`).getUTCDay();
    const monday = shiftDate(today, -((dayOfWeek + 6) % 7));
    return { key, label: "This Week", startDate: monday, endDate: today, fromValue: "", toValue: "", error: null };
  }

  if (key === "month") {
    return { key, label: "This Month", startDate: `${today.slice(0, 7)}-01`, endDate: today, fromValue: "", toValue: "", error: null };
  }

  return { key: "all", label: "All Time", startDate: null, endDate: null, fromValue: "", toValue: "", error: null };
}

export default async function SalesPage({ searchParams }: { searchParams: SalesSearchParams }) {
  const params = await searchParams;
  const selection = resolveSelection(params);
  const page = resolvePage(searchParamValue(params, "page"));
  const report = selection.error
    ? null
    : await getAdminSalesReport(selection.startDate, selection.endDate, page);

  return <AdminSalesDashboard report={report} selection={selection} />;
}
