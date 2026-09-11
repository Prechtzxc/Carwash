import Link from "next/link";

import { AdminTransactionDashboard } from "@/components/admin-transaction-dashboard";
import { ArrowRight, QrCode } from "@/components/icons";
import { getAdminTransactionDashboardData } from "@/lib/transactions/data";

export default async function AdminDashboardPage() {
  const transactionData = await getAdminTransactionDashboardData();

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 border-b border-[#dfddd4] pb-5 sm:gap-5 sm:pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65635d] sm:mt-3 sm:text-base sm:leading-7">Manage incoming customer check-ins and carwash activity.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#3d3d3d] bg-[#171717] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] transition-colors hover:border-[#595959] hover:bg-[#343434] hover:text-white active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#a77f00]/50 sm:w-auto sm:min-w-[230px]" href="/admin/catalog">
            <span className="text-white">Configure catalog and pricing</span>
            <ArrowRight className="h-4 w-4 text-[#f4c400]" />
          </Link>
          <Link className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d7d4ca] bg-white px-4 text-sm font-bold text-[#171717] shadow-[0_8px_18px_rgba(0,0,0,0.06)] transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 sm:w-auto sm:min-w-[230px]" href="/admin/qr">
            <QrCode className="h-4 w-4 text-[#a77f00]" />
            <span className="text-[#171717]">Display customer QR</span>
          </Link>
        </div>
      </header>

      <AdminTransactionDashboard data={transactionData} />
    </div>
  );
}
