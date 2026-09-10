"use client";

export default function CheckInError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f8f7] px-4 py-10">
      <section className="w-full max-w-lg rounded-[1.75rem] border border-[#f0d3c8] bg-white p-6 text-center shadow-[0_20px_55px_rgba(35,73,70,0.08)] sm:p-10">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#b34646]">Check-in unavailable</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">Please check your connection.</h1>
        <p className="mt-4 text-sm leading-6 text-[#64757a]">Customer check-in needs a live connection. Nothing has been saved on this device.</p>
        <button className="mt-7 inline-flex min-h-13 items-center justify-center rounded-xl bg-[#0d8278] px-6 text-sm font-bold text-white transition-colors hover:bg-[#096e67]" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
