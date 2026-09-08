import Link from "next/link";

import { ArrowRight, CarFront, ChevronRight, Clock, Users } from "@/components/icons";
import type { ClientDirectoryReport, ClientSortKey } from "@/lib/clients/data";

function formatCurrency(value: number) {
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No completed visit";
  }

  return new Date(value).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function directoryHref({ page, search, sort }: { page?: number; search: string; sort: ClientSortKey }) {
  const query = new URLSearchParams();

  if (search) {
    query.set("search", search);
  }

  if (sort !== "recent") {
    query.set("sort", sort);
  }

  if (page && page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return queryString ? `/admin/clients?${queryString}` : "/admin/clients";
}

function SummaryCard({ detail, icon, label, value }: { detail: string; icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-[1.35rem] border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#829196]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#102c38]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6b7b7f]">{detail}</p>
    </div>
  );
}

function ClientRow({ customer }: { customer: ClientDirectoryReport["customers"][number] }) {
  return (
    <Link
      className="group block rounded-[1.35rem] border border-[#dce8e4] bg-white p-5 shadow-[0_10px_28px_rgba(35,73,70,0.035)] transition-all hover:-translate-y-0.5 hover:border-[#9acdc3] hover:shadow-[0_16px_34px_rgba(35,73,70,0.08)] sm:p-6"
      href={`/admin/clients/${customer.id}`}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_0.8fr_0.8fr_0.9fr_auto] lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#102c38] text-sm font-black tracking-[0.04em] text-[#a9eee2]">
            {initials(customer.customerName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-[-0.025em] text-[#18323c]">{customer.customerName}</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#0d8278]">{customer.mobileNumber}</p>
            <p className="mt-1 truncate text-xs text-[#829196]">{customer.email ?? "No email provided"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-[#edf2f0] pt-4 sm:grid-cols-3 lg:block lg:border-0 lg:pt-0">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#829196]">Visits</p>
            <p className="mt-1 font-black text-[#18323c]">{customer.completedVisits}</p>
          </div>
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#829196]">Vehicles</p>
            <p className="mt-1 font-black text-[#18323c]">{customer.vehicleCount}</p>
          </div>
          <div className="sm:col-span-1">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#829196]">Last visit</p>
            <p className="mt-1 text-sm font-semibold text-[#486168]">{formatDate(customer.lastCompletedVisit)}</p>
          </div>
        </div>

        <div className="border-t border-[#edf2f0] pt-4 lg:border-0 lg:pt-0">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#829196]">Completed spend</p>
          <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[#102c38]">{formatCurrency(customer.totalTransactionAmount)}</p>
          <p className="mt-1 text-xs text-[#829196]">Completed transactions only</p>
        </div>

        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0d8278] lg:justify-self-end">
          Open profile
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function Pagination({ report, search, sort }: { report: ClientDirectoryReport; search: string; sort: ClientSortKey }) {
  const { page, totalMatches, totalPages } = report.pagination;

  if (totalMatches === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[#dce8e4] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#6b7b7f]">
        Page <strong className="text-[#36525a]">{page}</strong> of <strong className="text-[#36525a]">{totalPages}</strong> · {totalMatches} matching client{totalMatches === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#d7e5e0] bg-white px-3.5 text-sm font-bold text-[#486168] transition-colors hover:border-[#a8cfc5] hover:text-[#0d8278]" href={directoryHref({ page: page - 1, search, sort })}>
            <ChevronRight className="h-4 w-4 rotate-180" />
            Previous
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#edf2f0] bg-[#f8fbfa] px-3.5 text-sm font-bold text-[#b2bfbd]">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#0d8278] px-3.5 text-sm font-bold text-white transition-colors hover:bg-[#096e67]" href={directoryHref({ page: page + 1, search, sort })}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#dce8e4] px-3.5 text-sm font-bold text-[#829196]">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminClientDirectory({ report, search, sort }: { report: ClientDirectoryReport; search: string; sort: ClientSortKey }) {
  const hasMatches = report.customers.length > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Client directory</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e] sm:text-4xl">Know who keeps coming back.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#64757a]">A living view of customer relationships, current vehicles, and completed work. Search by name, mobile number, or plate.</p>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#102c38] text-[#a9eee2] shadow-[0_14px_30px_rgba(16,44,56,0.14)]">
          <Users className="h-8 w-8" />
        </div>
      </header>

      <section className="rounded-[1.5rem] border border-[#ccebe3] bg-[#e9f8f4] p-5 sm:p-7">
        <div className="flex flex-col gap-2 border-b border-[#ccebe3] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Find a client</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Search the directory</h2>
          </div>
          <span className="text-sm font-semibold text-[#52706e]">Completed visits power the activity totals</span>
        </div>

        <form action="/admin/clients" className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px_auto] lg:items-end" method="get">
          <div>
            <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#607378]" htmlFor="client-search">Name, mobile, or plate</label>
            <input className="mt-1.5 min-h-12 w-full rounded-xl border border-[#c6e3dc] bg-white px-4 text-sm text-[#18323c] outline-none placeholder:text-[#9aa9aa] focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb]" defaultValue={search} id="client-search" name="search" placeholder="Try Maria, 0917..., or ABC 123" type="search" />
          </div>
          <div>
            <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#607378]" htmlFor="client-sort">Sort by</label>
            <select className="mt-1.5 min-h-12 w-full rounded-xl border border-[#c6e3dc] bg-white px-4 text-sm font-semibold text-[#18323c] outline-none focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb]" defaultValue={sort} id="client-sort" name="sort">
              <option value="recent">Recent activity</option>
              <option value="name">Name</option>
              <option value="visits">Most visits</option>
              <option value="last_visit">Latest visit</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button className="min-h-12 rounded-xl bg-[#102c38] px-5 text-sm font-bold text-white transition-colors hover:bg-[#183d4b]" type="submit">Search clients</button>
            {search && <Link className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-[#0d8278] hover:bg-white/60" href="/admin/clients">Clear search</Link>}
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard detail="All customer records in the protected directory" icon={<Users className="h-4 w-4" />} label="Total clients" value={report.summary.totalCustomers} />
        <SummaryCard detail="Two or more completed visits" icon={<Clock className="h-4 w-4" />} label="Returning clients" value={report.summary.returningCustomers} />
        <SummaryCard detail="Current vehicles represented by this page" icon={<CarFront className="h-4 w-4" />} label="Showing" value={`${report.customers.length} of ${report.pagination.totalMatches}`} />
      </section>

      <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#dce8e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Customer records</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">{search ? `Results for “${search}”` : "Every client, at a glance"}</h2>
            <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Open a profile to review current details and the immutable completed transaction history.</p>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5d7475] sm:self-auto">Sorted by {sort === "recent" ? "recent activity" : sort === "last_visit" ? "latest visit" : sort === "visits" ? "most visits" : "name"}</span>
        </div>

        <div className="mt-5 space-y-3">
          {hasMatches ? report.customers.map((customer) => <ClientRow customer={customer} key={customer.id} />) : (
            <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f5f1] text-[#0d8278]"><Users className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold text-[#18323c]">{search ? "No matching clients" : "No client records yet"}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b7b7f]">{search ? "Try a different name, mobile number, or plate. Search uses the current customer and vehicle records." : "Customer records will appear here after the first check-in is submitted."}</p>
            </div>
          )}
        </div>

        <div className="mt-6"><Pagination report={report} search={search} sort={sort} /></div>
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196]"><Clock className="h-4 w-4 text-[#0d9f91]" />Visit totals and spend include completed transactions only.</p>
    </div>
  );
}
