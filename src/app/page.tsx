import Link from "next/link";

import { ArrowRight, ArrowUpRight, CarFront, CheckCircle, ClipboardCheck, Droplets, Sparkles } from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f1e7]">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <header className="flex min-h-[92px] items-center justify-between gap-3">
          <BrandMark />
          <nav aria-label="Site navigation" className="flex items-center gap-1 sm:gap-2">
            <Link className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#5f5d57] transition-colors hover:bg-white hover:text-[#171717] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 sm:inline-flex sm:px-4" href="/check-in">Customer check-in</Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f4c400] px-3 text-xs font-bold text-[#171717] shadow-[0_10px_22px_rgba(177,139,0,0.2)] transition-colors hover:bg-[#ffe45e] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 sm:px-5 sm:text-sm" href="/admin">
              Admin sign in
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>
        </header>

        <section className="grid gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[0.98] tracking-[-0.065em] text-[#171717] sm:text-6xl lg:text-[5.5rem]">Make every wash visit <span className="text-[#a77f00]">flow.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#65635d] sm:text-lg">Cool Car Centrale makes customer arrival smoother and day-to-day carwash operations easier to run.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f4c400] px-6 text-sm font-bold text-[#171717] shadow-[0_12px_25px_rgba(177,139,0,0.2)] transition-colors hover:bg-[#ffe45e] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href="/check-in">
                Open customer check-in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d7d4ca] bg-[#fffdf7] px-6 text-sm font-bold text-[#292929] transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href="/admin">
                Admin sign in
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-[#dfddd4] pt-6">
              <div>
                <dt className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Customer side</dt>
                <dd className="mt-2 text-sm font-bold text-[#292929]">Simple check-in</dd>
              </div>
              <div>
                <dt className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Admin side</dt>
                <dd className="mt-2 text-sm font-bold text-[#292929]">Three modules</dd>
              </div>
              <div>
                <dt className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Built for</dt>
                <dd className="mt-2 text-sm font-bold text-[#292929]">Every screen</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[590px] lg:mx-0 lg:justify-self-end">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#f4c400]/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-[#e5d27c]/30 blur-3xl" />
            <div className="relative rounded-[2rem] border border-[#dfddd4] bg-white p-4 shadow-[0_28px_70px_rgba(0,0,0,0.1)] sm:p-5">
              <div className="rounded-[1.5rem] bg-[#171717] p-5 text-white sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#f4c400]">Workspace overview</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">A clean operational start.</h2>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4c400]/15 text-[#f4c400]"><Sparkles className="h-5 w-5" /></span>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <CarFront className="h-5 w-5 text-[#f4c400]" />
                    <p className="mt-7 text-sm font-bold">Customer check-in</p>
                    <p className="mt-1 text-xs text-slate-400">Public entry point</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <Droplets className="h-5 w-5 text-[#f4c400]" />
                    <p className="mt-7 text-sm font-bold">Operations shell</p>
                    <p className="mt-1 text-xs text-slate-400">Team workspace</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 px-2 pb-1 pt-5 sm:grid-cols-3 sm:px-3">
                {[
                  { label: "Sales", detail: "Track completed work" },
                  { label: "Clients", detail: "Keep records clear" },
                  { label: "Inventory", detail: "Monitor stock" },
                ].map((item) => (
                  <div className="flex items-center gap-3 rounded-xl bg-[#f2f1eb] p-3" key={item.label}>
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#a77f00]" />
                    <div>
                      <p className="text-xs font-bold text-[#383838]">{item.label}</p>
                      <p className="mt-0.5 text-[0.65rem] text-[#89867d]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#dfddd4] py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Designed with intent</p>
              <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-[-0.05em] text-[#171717] sm:text-4xl">Less clutter. Better handoffs.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#a77f00] shadow-[0_5px_16px_rgba(0,0,0,0.08)]"><ClipboardCheck className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold text-[#292929]">One clear starting point</h3>
                <p className="mt-2 text-sm leading-6 text-[#65635d]">A customer-facing entry point that is easy to find, understand, and use.</p>
              </div>
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#171717] shadow-[0_5px_16px_rgba(0,0,0,0.08)]"><CarFront className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold text-[#292929]">Built around the visit</h3>
                <p className="mt-2 text-sm leading-6 text-[#65635d]">A clear handoff for the information the team needs from arrival through completion.</p>
              </div>
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#a77f00] shadow-[0_5px_16px_rgba(0,0,0,0.08)]"><Sparkles className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold text-[#292929]">Built to grow</h3>
                <p className="mt-2 text-sm leading-6 text-[#65635d]">A clean structure that can grow into connected operations without extra noise.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[#dfddd4] py-7 text-xs text-[#89867d] sm:flex-row sm:items-center sm:justify-between">
          <p>Cool Car Centrale Carwash Management System</p>
          <p>Customer check-in and operations</p>
        </footer>
      </div>
    </main>
  );
}
