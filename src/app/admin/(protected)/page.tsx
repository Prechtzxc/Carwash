import { AdminTransactionDashboard } from "@/components/admin-transaction-dashboard";
import { getAdminTransactionDashboardData } from "@/lib/transactions/data";

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>;

function searchParamValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function resolveRecentPage(value: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1;
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  const params = await searchParams;
  const recentPage = resolveRecentPage(searchParamValue(params, "recentPage"));
  const transactionData = await getAdminTransactionDashboardData(recentPage);

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <AdminTransactionDashboard data={transactionData} />
    </>
  );
}
