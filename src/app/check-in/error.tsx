"use client";

export default function CheckInError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1e7] px-4 py-10">
      <section className="w-full max-w-lg rounded-[1.75rem] border border-[#f0d3c8] bg-white p-6 text-center shadow-[0_20px_55px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#b34646]">Check-in unavailable</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#171717]">Check-in is temporarily unavailable.</h1>
        <p className="mt-4 text-sm leading-6 text-[#65635d]">We could not load customer check-in right now. Please try again or ask the counter team for help. Nothing has been saved on this device.</p>
        <button className="mt-7 inline-flex min-h-13 items-center justify-center rounded-xl bg-[#f4c400] px-6 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
