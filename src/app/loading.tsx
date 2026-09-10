export default function Loading() {
  return (
    <main aria-busy="true" className="flex min-h-screen items-center justify-center bg-[#f5f1e7] px-4 py-10">
      <section aria-live="polite" className="w-full max-w-lg rounded-[1.75rem] border border-[#dfddd4] bg-white p-8 text-center shadow-[0_20px_55px_rgba(0,0,0,0.08)]" role="status">
        <div aria-hidden="true" className="mx-auto h-10 w-10 animate-pulse rounded-xl bg-[#fff0a8]" />
        <p className="mt-5 text-sm font-semibold text-[#4a4945]">Loading Cool Car Centrale...</p>
      </section>
    </main>
  );
}
