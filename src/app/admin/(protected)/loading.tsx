export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-6 sm:space-y-8" role="status">
      <section className="rounded-[1.75rem] bg-[#171717] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:p-10">
        <div aria-hidden="true" className="h-4 w-32 animate-pulse rounded bg-white/20" />
        <div aria-hidden="true" className="mt-5 h-10 max-w-xl animate-pulse rounded bg-white/15" />
        <div aria-hidden="true" className="mt-4 h-5 max-w-lg animate-pulse rounded bg-white/10" />
      </section>
      <p className="text-center text-sm font-semibold text-[#65635d]">Loading...</p>
    </div>
  );
}
