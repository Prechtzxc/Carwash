import Link from "next/link";

import { ArrowRight, ArrowUpRight, CarFront, CheckCircle, ClipboardCheck, Droplets, Sparkles } from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f8f7]">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <header className="flex min-h-[84px] items-center justify-between gap-2">
          <BrandMark />
          <nav aria-label="Site navigation" className="flex items-center gap-1 sm:gap-2">
            <Link className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#5f7278] transition-colors hover:bg-white hover:text-[#10222e] sm:inline-flex sm:px-4" href="/check-in">Customer check-in</Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#102c38] px-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(16,44,56,0.12)] transition-colors hover:bg-[#173e4d] sm:px-5 sm:text-sm" href="/admin">
              Admin sign in
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>
        </header>

        <section className="grid gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#ccebe3] bg-[#e9f8f4] px-3.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#0d8278]">
              <span className="h-2 w-2 rounded-full bg-[#29b49d]" />
              Phase 1 foundation
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[0.98] tracking-[-0.065em] text-[#10222e] sm:text-6xl lg:text-[5.5rem]">Make every wash visit <span className="text-[#0d9f91]">flow.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#64757a] sm:text-lg">RinsePoint is a focused starting point for a smoother customer arrival and a clearer day-to-day carwash operation.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0d8278] px-6 text-sm font-bold text-white shadow-[0_12px_25px_rgba(13,130,120,0.2)] transition-colors hover:bg-[#096e67]" href="/check-in">
                Open customer check-in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#cbdcd8] bg-white px-6 text-sm font-bold text-[#28424d] transition-colors hover:border-[#9acdc3] hover:bg-[#f8fbfa]" href="/admin">
                Admin sign in
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-[#dce8e4] pt-6">
              <div>
                <dt className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Customer side</dt>
                <dd className="mt-2 text-sm font-bold text-[#28424d]">Simple check-in</dd>
              </div>
              <div>
                <dt className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Admin side</dt>
                <dd className="mt-2 text-sm font-bold text-[#28424d]">Three modules</dd>
              </div>
              <div>
                <dt className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Built for</dt>
                <dd className="mt-2 text-sm font-bold text-[#28424d]">Every screen</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[590px] lg:mx-0 lg:justify-self-end">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#b9eee4]/60 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-[#f5dca8]/40 blur-3xl" />
            <div className="relative rounded-[2rem] border border-[#d3e4df] bg-white p-4 shadow-[0_28px_70px_rgba(37,83,78,0.12)] sm:p-5">
              <div className="rounded-[1.5rem] bg-[#102c38] p-5 text-white sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#8fe7da]">Workspace overview</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">A clean operational start.</h2>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9cefe2]"><Sparkles className="h-5 w-5" /></span>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <CarFront className="h-5 w-5 text-[#9cefe2]" />
                    <p className="mt-7 text-sm font-bold">Customer check-in</p>
                    <p className="mt-1 text-xs text-slate-400">Public entry point</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <Droplets className="h-5 w-5 text-[#f2c46d]" />
                    <p className="mt-7 text-sm font-bold">Operations shell</p>
                    <p className="mt-1 text-xs text-slate-400">Admin foundation</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 px-2 pb-1 pt-5 sm:grid-cols-3 sm:px-3">
                {[
                  { label: "Sales", detail: "Ready to extend" },
                  { label: "Clients", detail: "Ready to extend" },
                  { label: "Inventory", detail: "Ready to extend" },
                ].map((item) => (
                  <div className="flex items-center gap-3 rounded-xl bg-[#f4f8f7] p-3" key={item.label}>
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#0d9f91]" />
                    <div>
                      <p className="text-xs font-bold text-[#36525a]">{item.label}</p>
                      <p className="mt-0.5 text-[0.65rem] text-[#829196]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#dce8e4] py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Designed with intent</p>
              <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-[-0.05em] text-[#10222e] sm:text-4xl">Less clutter. Better handoffs.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0d8278] shadow-[0_5px_16px_rgba(35,73,70,0.08)]"><ClipboardCheck className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold text-[#28424d]">One clear starting point</h3>
                <p className="mt-2 text-sm leading-6 text-[#708085]">A customer-facing entry point that is easy to find, understand, and use.</p>
              </div>
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#4966a4] shadow-[0_5px_16px_rgba(35,73,70,0.08)]"><CarFront className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold text-[#28424d]">Built around the visit</h3>
                <p className="mt-2 text-sm leading-6 text-[#708085]">A foundation for the information the team needs from arrival through completion.</p>
              </div>
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#ac7121] shadow-[0_5px_16px_rgba(35,73,70,0.08)]"><Sparkles className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold text-[#28424d]">Ready for the next phase</h3>
                <p className="mt-2 text-sm leading-6 text-[#708085]">A clean structure that can grow into connected operations without extra noise.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[#dce8e4] py-7 text-xs text-[#829196] sm:flex-row sm:items-center sm:justify-between">
          <p>RinsePoint Carwash Management System</p>
          <p>Phase 1 foundation</p>
        </footer>
      </div>
    </main>
  );
}
