"use client";

import Image from "next/image";

import { ArrowRight, CheckCircle, QrCode } from "@/components/icons";

export function QrCheckInPanel({ destinationUrl, qrDataUrl, qrError }: { destinationUrl: string | null; qrDataUrl: string | null; qrError: string | null }) {

  if (!destinationUrl) {
    return (
       <section className="rounded-[1.75rem] border border-[#ead98a] bg-[#fff9d9] p-4 sm:p-8">
         <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#756000]">Configuration needed</p>
         <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#171717]">Customer QR is not ready.</h2>
         <p className="mt-3 text-sm leading-6 text-[#756000]">Set the production app URL in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_APP_URL</code>, then reload this page. No QR code was generated.</p>
      </section>
    );
  }

  return (
      <section className="rounded-[1.75rem] border border-[#dfddd4] bg-white p-4 shadow-[0_20px_55px_rgba(0,0,0,0.08)] sm:p-7 print:border-0 print:p-0 print:shadow-none">
       <div className="text-center">
          <Image alt="Cool Car Centrale" className="mx-auto h-auto w-[150px] rounded-xl bg-white object-contain p-1 sm:w-[220px]" height={1000} sizes="(max-width: 639px) 150px, 220px" src="/img/logo.jpg" width={2000} />
          <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00] sm:mt-6">Customer Check-In</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#171717] sm:mt-3 sm:text-3xl">Scan to start your visit.</h2>
         <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#65635d]">Place this QR code where customers can scan it with a phone or shared tablet.</p>
       </div>

        <div className="mx-auto mt-5 flex min-h-[248px] max-w-[420px] items-center justify-center rounded-2xl border border-[#dfddd4] bg-white p-3 sm:mt-7 sm:min-h-[320px] sm:p-6 print:mt-10 print:border-0">
         {qrDataUrl ? <Image alt="QR code for Cool Car Centrale customer check-in" className="h-auto w-full max-w-[360px]" height={360} src={qrDataUrl} unoptimized width={360} /> : qrError ? <p className="text-center text-sm font-semibold text-[#b34646]">{qrError}</p> : <p className="text-sm font-semibold text-[#65635d]">Preparing QR code...</p>}
       </div>

        <div className="mt-4 rounded-2xl bg-[#f7f6f1] p-4 text-center sm:mt-6 print:mt-8">
         <p className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Destination URL</p>
         <p className="mt-2 break-all font-mono text-sm font-semibold text-[#292929]">{destinationUrl}</p>
       </div>

        <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:justify-center print:hidden">
           <a className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors sm:w-auto ${qrDataUrl ? "bg-[#f4c400] text-[#171717] hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" : "pointer-events-none bg-[#d5d1c5] text-[#8a877e]"}`} download="cool-car-centrale-customer-check-in.png" href={qrDataUrl || undefined}>
           Download QR
           <ArrowRight className="h-4 w-4" />
         </a>
          <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d7d4ca] bg-white px-5 text-sm font-bold text-[#292929] transition-colors hover:border-[#c7a900] hover:bg-[#fffdf2] sm:w-auto" onClick={() => window.print()} type="button">
          Print QR
        </button>
      </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#89867d] sm:mt-6 print:hidden">
         <CheckCircle className="h-4 w-4 text-[#a77f00]" />
        This QR code contains only the public customer check-in URL.
      </p>
       <QrCode className="mx-auto mt-6 hidden h-8 w-8 text-[#a77f00] print:block" />
    </section>
  );
}
