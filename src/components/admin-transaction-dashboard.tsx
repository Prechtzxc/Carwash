import Link from "next/link";

import { ArrowRight, CheckCircle, ClipboardCheck, Clock, QrCode, Sparkles } from "@/components/icons";
import type { AdminTransaction, AdminTransactionDashboardData, AdminTransactionPagination, TransactionStatus } from "@/lib/transactions/data";

const statusStyles: Record<TransactionStatus, { badge: string; dot: string }> = {
  pending: { badge: "bg-[#fff7cc] text-[#756000]", dot: "bg-[#d4a900]" },
  confirmed: { badge: "bg-[#f5edb6] text-[#756000]", dot: "bg-[#b58b00]" },
  completed: { badge: "bg-[#f1f0eb] text-[#3f3f3f]", dot: "bg-[#171717]" },
  cancelled: { badge: "bg-[#fff0ed] text-[#b34646]", dot: "bg-[#d4665f]" },
};

const statusLabels: Record<TransactionStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatCurrency(value: number) {
  return `PHP ${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles = statusStyles[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${styles.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {statusLabels[status]}
    </span>
  );
}

function MetricCard({ detail, label, tone, value }: { detail: string; label: string; tone: "amber" | "yellow"; value: number }) {
  return (
    <div className={tone === "amber" ? "rounded-2xl border border-[#ead98a] bg-[#fff9d9] p-4 sm:p-5" : "rounded-2xl border border-[#ead98a] bg-[#fff7cc] p-4 sm:p-5"}>
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#756000]">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#171717]">{value}</p>
      <p className={tone === "amber" ? "mt-1 text-xs text-[#756000]" : "mt-1 text-xs text-[#6f652f]"}>{detail}</p>
    </div>
  );
}

function vehicleLabel(transaction: AdminTransaction) {
  const details = [transaction.vehicle.make, transaction.vehicle.model].filter(Boolean).join(" ");
  return details ? `${details} / ${transaction.vehicle.categoryName}` : transaction.vehicle.categoryName;
}

function serviceLabel(transaction: AdminTransaction) {
  return transaction.services.map((service) => service.name).join(", ") || "No services listed";
}

function RequestCard({ transaction }: { transaction: AdminTransaction }) {
  return (
    <article className="rounded-2xl border border-[#dfddd4] bg-white p-4 shadow-[0_12px_35px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-sm font-black tracking-[0.08em] text-[#171717]">{transaction.transactionNumber}</p>
          <p className="mt-1 text-xs text-[#89867d]">Submitted {formatDateTime(transaction.createdAt)}</p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>

      <div className="mt-4 grid gap-3 border-y border-[#e8e5dc] py-3 sm:mt-5 sm:gap-4 sm:py-4 sm:grid-cols-2">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Customer</p>
          <p className="mt-1 break-words font-bold text-[#292929]">{transaction.customerName}</p>
          <p className="mt-1 text-sm text-[#65635d]">{transaction.customer.mobile_number}</p>
        </div>
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Vehicle</p>
          <p className="mt-1 break-words font-bold text-[#292929]">{vehicleLabel(transaction)}</p>
          {transaction.vehicle.plate_number && <p className="mt-1 text-sm text-[#65635d]">Plate {transaction.vehicle.plate_number}</p>}
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Services</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#4a4945]">{serviceLabel(transaction)}</p>
        {transaction.products.length > 0 && <p className="mt-1 break-words text-sm text-[#65635d]">Products: {transaction.products.map((product) => `${product.name} x${product.quantity}`).join(", ")}</p>}
      </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#e8e5dc] pt-3 sm:mt-5 sm:gap-4 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Total</p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[#171717]">{formatCurrency(transaction.total)}</p>
        </div>
        <Link className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-5 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 sm:w-auto" href={`/admin/transactions/${transaction.id}`}>
          {transaction.status === "confirmed" ? "Complete transaction" : "Review"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function recentSubmissionsHref(page: number) {
  return page > 1 ? `/admin?recentPage=${page}` : "/admin";
}

function RecentPagination({ pagination }: { pagination: AdminTransactionPagination }) {
  if (pagination.totalItems === 0) {
    return null;
  }

  const firstShown = (pagination.page - 1) * pagination.pageSize + 1;
  const lastShown = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-[#dfddd4] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#65635d]">
        Showing <strong className="text-[#3f3f3f]">{firstShown}-{lastShown}</strong> of <strong className="text-[#3f3f3f]">{pagination.totalItems}</strong>
      </p>
      <nav aria-label="Recent submissions pagination" className="flex flex-wrap items-center gap-2">
        {pagination.page > 1 ? (
          <Link className="inline-flex min-h-10 items-center rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm font-bold text-[#4a4945] transition-colors hover:border-[#d4b900] hover:text-[#a77f00]" href={recentSubmissionsHref(pagination.page - 1)}>Previous</Link>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-xl border border-[#ebe9e2] bg-white px-3.5 text-sm font-bold text-[#b0ada4]">Previous</span>
        )}
        <span className="px-2 text-sm font-bold text-[#65635d]">Page {pagination.page} of {pagination.totalPages}</span>
        {pagination.page < pagination.totalPages ? (
          <Link className="inline-flex min-h-10 items-center rounded-xl bg-[#f4c400] px-3.5 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href={recentSubmissionsHref(pagination.page + 1)}>Next</Link>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-xl bg-[#e4e2da] px-3.5 text-sm font-bold text-[#89867d]">Next</span>
        )}
      </nav>
    </div>
  );
}

function RecentSubmissions({ pagination, transactions }: { pagination: AdminTransactionPagination; transactions: AdminTransaction[] }) {
  return (
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6" id="recent-submissions">
      <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-4 sm:pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Clock className="h-4 w-4" /></span>
          <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[#171717]">Recent submissions</h2>
          <p className="mt-1 text-sm leading-6 text-[#65635d]">The latest customer requests, newest first.</p>
          </div>
        </div>
        <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] sm:self-auto">{transactions.length} of {pagination.totalItems}</span>
      </div>

      <div className="mt-4 space-y-3">
        {transactions.length > 0 ? transactions.map((transaction) => (
          <Link className="flex flex-col gap-3 rounded-2xl border border-[#dfddd4] bg-white p-4 transition-colors hover:border-[#d4b900] sm:flex-row sm:items-center sm:justify-between" href={`/admin/transactions/${transaction.id}`} key={transaction.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black tracking-[0.06em] text-[#171717]">{transaction.transactionNumber}</p>
                <StatusBadge status={transaction.status} />
              </div>
            <p className="mt-1 truncate text-sm font-semibold text-[#4a4945]">{transaction.customerName} · {vehicleLabel(transaction)}</p>
            <p className="mt-1 text-xs text-[#89867d]">{formatDateTime(transaction.createdAt)}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <p className="text-sm font-black text-[#292929]">{formatCurrency(transaction.total)}</p>
              <ArrowRight className="h-4 w-4 text-[#a77f00]" />
            </div>
          </Link>
        )) : <p className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm leading-6 text-[#65635d]">No submissions yet.</p>}
      </div>
      <RecentPagination pagination={pagination} />
    </section>
  );
}

export function AdminTransactionDashboard({ data }: { data: AdminTransactionDashboardData }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6" id="incoming-check-ins">
        <div className="flex flex-col gap-4 border-b border-[#dfddd4] pb-4 sm:gap-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00] sm:h-11 sm:w-11"><ClipboardCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Incoming Check-Ins</p>
              <h2 className="mt-1 text-xl font-bold leading-tight tracking-[-0.04em] text-[#171717] sm:mt-2 sm:text-2xl">Review customer requests.</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#65635d] sm:mt-2">Requests arrive here as pending. Review the details before accepting or cancelling them.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-xs font-bold text-[#292929] transition-colors hover:border-[#c7a900] hover:bg-[#fffdf2] sm:text-sm" href="/admin/catalog">Configure catalog and pricing</Link>
            <Link className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-xs font-bold text-[#292929] transition-colors hover:border-[#c7a900] hover:bg-[#fffdf2] sm:text-sm" href="/admin/qr"><QrCode className="h-4 w-4 text-[#a77f00]" />Display customer QR</Link>
            <a className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-xs font-bold text-[#292929] transition-colors hover:border-[#c7a900] hover:bg-[#fffdf2] sm:text-sm" href="#recent-submissions">Recent submissions<ArrowRight className="h-4 w-4 text-[#a77f00]" /></a>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
          <MetricCard detail="Awaiting admin review" label="Pending requests" tone="amber" value={data.pendingCount} />
          <MetricCard detail="Accepted requests, not completed" label="Confirmed requests" tone="yellow" value={data.confirmedCount} />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#a77f00]" />
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#65635d]">Pending requests</h3>
            </div>
            <span className="text-xs font-semibold text-[#89867d]">Newest first</span>
          </div>
          <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-2">
            {data.pendingRequests.length > 0 ? data.pendingRequests.map((transaction) => <RequestCard key={transaction.id} transaction={transaction} />) : <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">No pending check-ins right now.</div>}
          </div>
        </div>

          <div className="mt-6 border-t border-[#dfddd4] pt-5 sm:mt-7 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#a77f00]" />
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#65635d]">Ready / confirmed</h3>
            </div>
            <span className="text-xs font-semibold text-[#89867d]">Complete after service</span>
          </div>
          <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-2">
            {data.confirmedRequests.length > 0 ? data.confirmedRequests.map((transaction) => <RequestCard key={transaction.id} transaction={transaction} />) : <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">No confirmed transactions are waiting for completion.</div>}
          </div>
        </div>
      </section>

      <RecentSubmissions pagination={data.recentPagination} transactions={data.recentSubmissions} />

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#89867d]">
        <CheckCircle className="h-4 w-4 text-[#a77f00]" />
        Only completed transactions post sales and deduct inventory.
      </p>
    </div>
  );
}
