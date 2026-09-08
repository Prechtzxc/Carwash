import { AdminClientDirectory } from "@/components/admin-client-directory";
import { clientSortKeys, getAdminClientDirectory, type ClientSortKey } from "@/lib/clients/data";

type ClientsSearchParams = Promise<Record<string, string | string[] | undefined>>;

function searchParamValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isClientSortKey(value: string): value is ClientSortKey {
  return (clientSortKeys as readonly string[]).includes(value);
}

function resolvePage(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100000 ? parsed : 1;
}

export default async function ClientsPage({ searchParams }: { searchParams: ClientsSearchParams }) {
  const params = await searchParams;
  const search = searchParamValue(params, "search").trim().slice(0, 100);
  const requestedSort = searchParamValue(params, "sort");
  const sort = isClientSortKey(requestedSort) ? requestedSort : "recent";
  const page = resolvePage(searchParamValue(params, "page"));
  const report = await getAdminClientDirectory({ page, search, sort });

  return <AdminClientDirectory report={report} search={search} sort={sort} />;
}
