import Link from "next/link";
import QRCode from "qrcode";

import { ArrowRight } from "@/components/icons";
import { QrCheckInPanel } from "@/components/qr-check-in-panel";
import { getPublicCheckInUrl } from "@/lib/public-check-in-url";

export default async function AdminQrPage() {
  const { error, url } = getPublicCheckInUrl();
  let qrDataUrl: string | null = null;
  let qrError: string | null = null;

  if (url) {
    try {
      qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 420,
        color: {
          dark: "#102c38",
          light: "#ffffff",
        },
      });
    } catch {
      qrError = "The QR code could not be generated. Try refreshing this page.";
    }
  }

  return (
    <div className="space-y-8 print:space-y-0">
      <header className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Customer access utility</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e] sm:text-4xl">Customer check-in QR</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#64757a]">Display or print a public QR code for the shared tablet and carwash entrance.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cbdcd8] bg-white px-4 text-sm font-bold text-[#28424d] transition-colors hover:border-[#9acdc3] hover:bg-[#f8fbfa]" href="/admin">
          Back to dashboard
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Link>
      </header>

      {error ? <p className="rounded-xl border border-[#f0dfb8] bg-[#fff8e8] px-4 py-3 text-sm font-semibold leading-6 text-[#796239] print:hidden">{error}</p> : null}
      <QrCheckInPanel destinationUrl={url} qrDataUrl={qrDataUrl} qrError={qrError} />
    </div>
  );
}
