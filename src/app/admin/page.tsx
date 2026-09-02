import Link from "next/link";

import { ArrowRight, ArrowUpRight, CarFront, CheckCircle, ShieldCheck, Sparkles } from "@/components/icons";
import { NavigationIcon } from "@/components/navigation-icon";
import { adminNavigation } from "@/lib/navigation";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#102c38] px-6 py-8 text-white shadow-[0_20px_50px_rgba(16,44,56,0.16)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-[#1d756e]/30" />
        <div className="absolute -bottom-28 right-24 h-60 w-60 rounded-full border-[24px] border-[#2bb6a2]/10" />
        <div className="relative max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#8fe7da]">Admin overview</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.05em] sm:text-4xl lg:text-[2.85rem]">A clear view of the wash floor starts here.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">RinsePoint gives the team a calm operational home for the customer journey and the work that follows it.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1b685f] px-4 text-xs font-semibold text-[#c2fff5]">
              <CheckCircle className="h-4 w-4" />
              Foundation ready
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 text-xs font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#f2c46d]" />
              No live data connected
            </span>
          </div>
        </div>
        <div className="relative mt-10 grid max-w-lg grid-cols-2 gap-3 sm:absolute sm:bottom-10 sm:right-8 sm:mt-0 sm:w-[310px] lg:right-10">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
            <CarFront className="h-5 w-5 text-[#9cefe2]" />
            <p className="mt-8 text-sm font-semibold text-white">Customer journey</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Check-in foundation</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-[#f2c46d]" />
            <p className="mt-8 text-sm font-semibold text-white">Operations</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Three focused modules</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Workspace modules</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#10222e]">Everything has a place.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#708085] sm:text-right">The admin shell stays intentionally focused on the three modules that matter.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {adminNavigation.map((item) => (
            <Link
              className="group rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(35,73,70,0.09)]"
              href={item.href}
              key={item.href}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]">
                <NavigationIcon className="h-5 w-5" name={item.icon} />
              </span>
              <div className="mt-7 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-[-0.025em] text-[#10222e]">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#708085]">{item.description}</p>
                </div>
                <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[#86a09d] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0d8278]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#dce8e4] bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#829196]">Phase 1 scope</p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10222e]">A stable starting point.</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "Customer check-in shell",
              "Responsive admin shell",
              "Backend connection planned",
            ].map((item) => (
              <div className="rounded-xl bg-[#f4f8f7] p-4" key={item}>
                <CheckCircle className="h-4 w-4 text-[#0d9f91]" />
                <p className="mt-3 text-sm font-semibold leading-5 text-[#36525a]">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-[#ccebe3] bg-[#e9f8f4] p-6 sm:p-7">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Customer side</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#10222e]">The check-in doorway is ready for its next layer.</h2>
            <p className="mt-3 text-sm leading-6 text-[#52706e]">Open the public-facing placeholder to review the tablet-friendly entry point.</p>
          </div>
          <Link className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0d8278] px-5 text-sm font-bold text-white transition-colors hover:bg-[#096e67]" href="/check-in">
            View customer check-in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
