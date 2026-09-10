"use client";

import Image from "next/image";

import { ArrowRight, CheckCircle, QrCode } from "@/components/icons";

export function QrCheckInPanel({ destinationUrl, qrDataUrl, qrError }: { destinationUrl: string | null; qrDataUrl: string | null; qrError: string | null }) {

  if (!destinationUrl) {
    return (
      <section className="rounded-[1.75rem] border border-[#f0dfb8] bg-[#fff8e8] p-6 sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#ac7121]">Configuration needed</p>
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#10222e]">Customer QR is not ready.</h2>
        <p className="mt-3 text-sm leading-6 text-[#796239]">Set the production app URL in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_APP_URL</code>, then reload this page. No QR code was generated.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-[#dce8e4] bg-white p-5 shadow-[0_20px_55px_rgba(35,73,70,0.08)] sm:p-8 print:border-0 print:p-0 print:shadow-none">
      <div className="text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Customer Check-In</p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">Scan to start your visit.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#64757a]">Place this QR code where customers can scan it with a phone or shared tablet.</p>
      </div>

      <div className="mx-auto mt-7 flex min-h-[320px] max-w-[420px] items-center justify-center rounded-2xl border border-[#dce8e4] bg-white p-4 sm:p-6 print:mt-10 print:border-0">
        {qrDataUrl ? <Image alt="QR code for RinsePoint customer check-in" className="h-auto w-full max-w-[360px]" height={360} src={qrDataUrl} unoptimized width={360} /> : qrError ? <p className="text-center text-sm font-semibold text-[#b34646]">{qrError}</p> : <p className="text-sm font-semibold text-[#607378]">Preparing QR code...</p>}
      </div>

      <div className="mt-6 rounded-2xl bg-[#f4f8f7] p-4 text-center print:mt-8">
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Destination URL</p>
        <p className="mt-2 break-all font-mono text-sm font-semibold text-[#28424d]">{destinationUrl}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
        <a className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors ${qrDataUrl ? "bg-[#0d8278] hover:bg-[#096e67]" : "pointer-events-none bg-[#9eb8b3]"}`} download="rinsepoint-customer-check-in.png" href={qrDataUrl || undefined}>
          Download QR
          <ArrowRight className="h-4 w-4" />
        </a>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbdcd8] bg-white px-5 text-sm font-bold text-[#28424d] transition-colors hover:border-[#9acdc3] hover:bg-[#f8fbfa]" onClick={() => window.print()} type="button">
          Print QR
        </button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196] print:hidden">
        <CheckCircle className="h-4 w-4 text-[#0d9f91]" />
        This QR code contains only the public customer check-in URL.
      </p>
      <QrCode className="mx-auto mt-6 hidden h-8 w-8 text-[#0d8278] print:block" />
    </section>
  );
}
