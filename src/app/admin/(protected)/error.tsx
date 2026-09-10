"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section aria-labelledby="admin-error-title" className="rounded-[1.5rem] border border-[#f0d3c8] bg-[#fff8f6] p-6 sm:p-8" role="alert">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#b34646]">Admin workspace unavailable</p>
      <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#6f3333]" id="admin-error-title">We could not load this workspace.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#9f4c47]">The request failed before the page could finish loading. Try again, or return to the dashboard if the problem continues.</p>
       <button className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f4c400] px-5 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" onClick={reset} type="button">Try again</button>
    </section>
  );
}
