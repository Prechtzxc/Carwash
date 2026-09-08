import Link from "next/link";

import { ArrowRight, ChartLine, CheckCircle } from "@/components/icons";
import { getAdminSalesSummary } from "@/lib/transactions/data";

function formatCurrency(value: number) {
  return `PHP ${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function SalesPage() {
  const summary = await getAdminSalesSummary();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Sales</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[#10222e] sm:text-4xl">Sales begin when work is complete.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#64757a]">Total sales uses the authoritative transaction total for completed transactions only.</p>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#dff6f0] text-[#0d8278] ring-1 ring-[#c7ebe3]">
          <ChartLine className="h-8 w-8" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-[#ccebe3] bg-[#e9f8f4] p-6 shadow-[0_12px_35px_rgba(35,73,70,0.05)] sm:p-7">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Total sales</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.055em] text-[#102c38] sm:text-5xl">{formatCurrency(summary.totalSales)}</p>
          <p className="mt-3 text-sm leading-6 text-[#52706e]">Sum of <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs font-bold text-[#36525a]">transactions.total</code> where status is completed.</p>
        </div>
        <div className="rounded-2xl border border-[#dce8e4] bg-white p-6 shadow-[0_12px_35px_rgba(35,73,70,0.05)] sm:p-7">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#829196]">Completed transactions</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.055em] text-[#102c38]">{summary.completedCount}</p>
          <p className="mt-3 text-sm leading-6 text-[#6b7b7f]">Each completed transaction is counted once.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#b9d4ce] bg-[#edf8f5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0d8278] shadow-sm">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Operational total</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#4f6d6c]">Pending, confirmed, and cancelled transactions are excluded until the completion operation succeeds.</p>
          </div>
        </div>
        <Link className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-xs font-bold text-[#0d8278] shadow-sm transition-colors hover:bg-[#f7fffc] sm:self-auto" href="/admin">
          View ready transactions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
