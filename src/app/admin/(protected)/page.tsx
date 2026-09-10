import Link from "next/link";

import { AdminTransactionDashboard } from "@/components/admin-transaction-dashboard";
import { ArrowRight, ArrowUpRight, CarFront, CheckCircle, QrCode, ShieldCheck, Sparkles } from "@/components/icons";
import { NavigationIcon } from "@/components/navigation-icon";
import { adminNavigation } from "@/lib/navigation";
import { getAdminTransactionDashboardData } from "@/lib/transactions/data";

export default async function AdminDashboardPage() {
  const transactionData = await getAdminTransactionDashboardData();

  return (
    <div className="space-y-8">
       <section className="relative overflow-hidden rounded-[1.75rem] bg-[#171717] px-6 py-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.16)] sm:px-8 sm:py-10 lg:px-10">
         <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-[#c7a900]/30" />
         <div className="absolute -bottom-28 right-24 h-60 w-60 rounded-full border-[24px] border-[#f4c400]/10" />
        <div className="relative max-w-2xl">
           <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f4c400]">Admin overview</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.05em] sm:text-4xl lg:text-[2.85rem]">Carwash Admin Dashboard</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Your authenticated workspace for incoming customer check-ins and the Sales, Clients, Inventory, and catalog configuration areas.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
             <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#4a3d00] px-4 text-xs font-semibold text-[#ffe67a]">
               <CheckCircle className="h-4 w-4" />
               Live operations
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 text-xs font-semibold text-slate-300">
               <span className="h-2 w-2 rounded-full bg-[#f4c400]" />
              Customer submissions connected
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
             <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#ffe67a] transition-colors hover:text-white" href="/admin/catalog">
              Configure catalog and pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
             <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#ffe67a] transition-colors hover:text-white" href="/admin/qr">
              <QrCode className="h-4 w-4" />
              Display customer QR
            </Link>
          </div>
        </div>
        <div className="relative mt-10 grid max-w-lg grid-cols-2 gap-3 sm:absolute sm:bottom-10 sm:right-8 sm:mt-0 sm:w-[310px] lg:right-10">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
             <CarFront className="h-5 w-5 text-[#f4c400]" />
            <p className="mt-8 text-sm font-semibold text-white">Customer journey</p>
             <p className="mt-1 text-xs leading-5 text-slate-400">Customer arrival</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
             <Sparkles className="h-5 w-5 text-[#f4c400]" />
            <p className="mt-8 text-sm font-semibold text-white">Operations</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Three focused modules</p>
          </div>
        </div>
      </section>

      <AdminTransactionDashboard data={transactionData} />

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Workspace modules</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#171717]">Everything has a place.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#65635d] sm:text-right">The main navigation stays focused on three operational modules; catalog settings live separately.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {adminNavigation.map((item) => (
            <Link
              className="group rounded-2xl border border-[#dfddd4] bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(0,0,0,0.09)]"
              href={item.href}
              key={item.href}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]">
                <NavigationIcon className="h-5 w-5" name={item.icon} />
              </span>
              <div className="mt-7 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-[-0.025em] text-[#171717]">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#65635d]">{item.description}</p>
                </div>
                <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[#8d8a82] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#a77f00]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#dfddd4] bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><ShieldCheck className="h-5 w-5" /></span>
            <div>
             <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#89867d]">System status</p>
             <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#171717]">A secure base to build on.</h2>
            </div>
          </div>
           <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
             {[
               "Customer check-in",
               "Responsive admin workspace",
               "Protected admin access",
               "Catalog configuration",
             ].map((item) => (
              <div className="rounded-xl bg-[#f7f6f1] p-4" key={item}>
                <CheckCircle className="h-4 w-4 text-[#a77f00]" />
                <p className="mt-3 text-sm font-semibold leading-5 text-[#3f3f3f]">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-[#ead98a] bg-[#fff7cc] p-6 sm:p-7">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Customer side</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#171717]">The check-in doorway is ready.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6f652f]">Open the public-facing check-in page to review the tablet-friendly entry point.</p>
          </div>
          <Link className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 text-sm font-bold text-white transition-colors hover:bg-[#343434]" href="/check-in">
            View customer check-in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
