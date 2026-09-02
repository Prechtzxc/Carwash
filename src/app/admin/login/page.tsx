import type { Metadata } from "next";
import Link from "next/link";

import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { ArrowRight, ShieldCheck } from "@/components/icons";
import { getSafeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to the RinsePoint admin workspace.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = getSafeReturnPath(getFirstValue(params.next));
  const error = getFirstValue(params.error);
  const initialError = error === "configuration" || error === "unauthorized" ? error : undefined;

  return (
    <main className="min-h-screen bg-[#f4f8f7]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#102c38] p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[34px] border-[#1d756e]/30" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[28px] border-[#2bb6a2]/10" />
          <div className="relative">
            <BrandMark href="/" tone="light" />
            <div className="mt-24 max-w-lg">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#8fe7da]">Secure workspace</p>
              <h1 className="mt-5 text-5xl font-bold leading-[1.02] tracking-[-0.06em] xl:text-6xl">Keep the wash floor moving with clarity.</h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-300">RinsePoint gives the team one focused place to work across Sales, Clients, and Inventory.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 text-sm font-semibold text-[#b6ded8]">
            <ShieldCheck className="h-5 w-5 text-[#9cefe2]" />
            Cookie-based session security
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12 xl:px-20">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden"><BrandMark /></div>
            <Link className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#486168] transition-colors hover:bg-white hover:text-[#10222e]" href="/">
              Back to home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Admin sign in</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.055em] text-[#10222e]">Welcome back.</h2>
            <p className="mt-4 text-base leading-7 text-[#64757a]">Sign in to access the RinsePoint operations workspace.</p>
            <AdminLoginForm initialError={initialError} returnTo={returnTo} />
          </div>

          <p className="mx-auto w-full max-w-md text-xs leading-5 text-[#829196]">RinsePoint Carwash Management System</p>
        </section>
      </div>
    </main>
  );
}
