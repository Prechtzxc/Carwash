import Link from "next/link";

import { ArrowRight, CarFront, ClipboardCheck, Droplets, Layers } from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";

export default function CheckInPage() {
  return (
    <main className="min-h-screen bg-[#f4f8f7]">
      <header className="mx-auto flex min-h-[76px] w-full max-w-[1280px] items-center justify-between gap-4 border-b border-[#dce8e4] px-4 sm:px-6 lg:border-0 lg:px-10">
        <BrandMark />
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#486168] transition-colors hover:bg-white hover:text-[#10222e]" href="/">
          Back to home
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Customer check-in</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-[-0.055em] text-[#10222e] sm:text-5xl">Start with a simple hello.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#64757a] sm:text-lg">This tablet-friendly doorway will guide each customer from arrival to a clear request. The interactive check-in flow is planned for the next phase.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-stretch">
          <section className="rounded-[1.75rem] border border-[#dce8e4] bg-white p-6 shadow-[0_16px_45px_rgba(35,73,70,0.06)] sm:p-8">
            <div className="flex flex-col gap-5 border-b border-[#e5eeeb] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f5f1] text-[#0d8278]"><ClipboardCheck className="h-6 w-6" /></span>
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#829196]">Coming next</p>
                  <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Customer check-in flow</h2>
                </div>
              </div>
              <span className="inline-flex min-h-8 items-center self-start rounded-full bg-[#fff3d8] px-3 text-xs font-bold text-[#a36c1b]">Placeholder</span>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-center gap-4 rounded-xl border border-[#e5eeeb] bg-[#f8fbfa] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dff6f0] text-sm font-bold text-[#0d8278]">01</span>
                <div>
                  <p className="text-sm font-bold text-[#28424d]">Customer details</p>
                  <p className="mt-1 text-xs leading-5 text-[#77878b]">A short, welcoming first step.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-[#e5eeeb] bg-[#f8fbfa] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6edff] text-sm font-bold text-[#4966a4]">02</span>
                <div>
                  <p className="text-sm font-bold text-[#28424d]">Vehicle and services</p>
                  <p className="mt-1 text-xs leading-5 text-[#77878b]">A clear selection experience.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-[#e5eeeb] bg-[#f8fbfa] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0d4] text-sm font-bold text-[#ac7121]">03</span>
                <div>
                  <p className="text-sm font-bold text-[#28424d]">Review and submit</p>
                  <p className="mt-1 text-xs leading-5 text-[#77878b]">A confident handoff to the team.</p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 rounded-2xl bg-[#102c38] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 shrink-0 text-[#9cefe2]" />
                <p className="text-sm font-semibold text-slate-200">No form is active in Phase 1.</p>
              </div>
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#16434d] transition-colors hover:bg-[#e5f5f1]" href="/">
                Return home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <aside className="rounded-[1.75rem] border border-[#ccebe3] bg-[#e9f8f4] p-6 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0d8278] shadow-sm"><CarFront className="h-6 w-6" /></span>
            <p className="mt-8 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Designed for the counter</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.04em] text-[#10222e]">A calm start for every visit.</h2>
            <p className="mt-4 text-sm leading-6 text-[#52706e]">The next version will keep the experience easy to use on a shared tablet, phone, or a QR code entry point.</p>
            <div className="mt-8 flex items-center gap-3 border-t border-[#ccebe3] pt-5 text-sm font-semibold text-[#3d6564]">
              <Layers className="h-5 w-5 text-[#0d8278]" />
              Built to grow one step at a time
            </div>
          </aside>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 border-t border-[#dce8e4] px-4 py-7 text-xs text-[#829196] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p>RinsePoint customer check-in</p>
        <p>Phase 1 foundation</p>
      </footer>
    </main>
  );
}
