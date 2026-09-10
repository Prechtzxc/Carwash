import type { Metadata } from "next";
import Link from "next/link";

import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { ArrowRight, ShieldCheck } from "@/components/icons";
import { getSafeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to the Cool Car Centrale admin area.",
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
    <main className="min-h-screen bg-[#f5f1e7]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#171717] p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[34px] border-[#c7a900]/30" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[28px] border-[#f4c400]/10" />
          <div className="relative">
            <BrandMark href="/" tone="light" />
            <div className="mt-24 max-w-lg">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f4c400]">Admin access</p>
              <h1 className="mt-5 text-5xl font-bold leading-[1.02] tracking-[-0.06em] xl:text-6xl">Keep the wash floor moving with clarity.</h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Cool Car Centrale gives the team one focused place to work across Sales, Clients, and Inventory.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 text-sm font-semibold text-[#ddd6a1]">
            <ShieldCheck className="h-5 w-5 text-[#f4c400]" />
            Cookie-based session security
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12 xl:px-20">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden"><BrandMark /></div>
            <Link className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d7d4ca] bg-[#fffdf7] px-3.5 text-sm font-bold text-[#292929] shadow-sm transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc] hover:text-[#171717] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href="/">
              Back to home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Admin sign in</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.055em] text-[#171717]">Welcome back.</h2>
            <p className="mt-4 text-base leading-7 text-[#65635d]">Sign in to access the Cool Car Centrale dashboard.</p>
            <AdminLoginForm initialError={initialError} returnTo={returnTo} />
          </div>

          <p className="mx-auto w-full max-w-md text-xs leading-5 text-[#89867d]">Cool Car Centrale Carwash Management System</p>
        </section>
      </div>
    </main>
  );
}
