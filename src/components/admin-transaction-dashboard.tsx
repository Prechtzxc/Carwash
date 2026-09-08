import Link from "next/link";

import { ArrowRight, CheckCircle, ClipboardCheck, Clock, Sparkles } from "@/components/icons";
import type { AdminTransaction, AdminTransactionDashboardData, TransactionStatus } from "@/lib/transactions/data";

const statusStyles: Record<TransactionStatus, { badge: string; dot: string }> = {
  pending: { badge: "bg-[#fff3d8] text-[#9a681f]", dot: "bg-[#d49a38]" },
  confirmed: { badge: "bg-[#e1f6f0] text-[#0d8278]", dot: "bg-[#17a190]" },
  completed: { badge: "bg-[#e8edff] text-[#4b5c9b]", dot: "bg-[#6f83ca]" },
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

function MetricCard({ detail, label, tone, value }: { detail: string; label: string; tone: "amber" | "teal"; value: number }) {
  return (
    <div className={tone === "amber" ? "rounded-2xl border border-[#f1dfbd] bg-[#fff7e7] p-5" : "rounded-2xl border border-[#ccebe3] bg-[#e9f8f4] p-5"}>
      <p className={tone === "amber" ? "text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#a36c1b]" : "text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#0d8278]"}>{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{value}</p>
      <p className={tone === "amber" ? "mt-1 text-xs text-[#8d754f]" : "mt-1 text-xs text-[#52706e]"}>{detail}</p>
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
    <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black tracking-[0.08em] text-[#102c38]">{transaction.transactionNumber}</p>
          <p className="mt-1 text-xs text-[#829196]">Submitted {formatDateTime(transaction.createdAt)}</p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>

      <div className="mt-5 grid gap-4 border-y border-[#edf2f0] py-4 sm:grid-cols-2">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#829196]">Customer</p>
          <p className="mt-1 font-bold text-[#18323c]">{transaction.customerName}</p>
          <p className="mt-1 text-sm text-[#607378]">{transaction.customer.mobile_number}</p>
        </div>
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#829196]">Vehicle</p>
          <p className="mt-1 font-bold text-[#18323c]">{vehicleLabel(transaction)}</p>
          {transaction.vehicle.plate_number && <p className="mt-1 text-sm text-[#607378]">Plate {transaction.vehicle.plate_number}</p>}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#829196]">Services</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#486168]">{serviceLabel(transaction)}</p>
        {transaction.products.length > 0 && <p className="mt-1 text-sm text-[#607378]">Products: {transaction.products.map((product) => `${product.name} x${product.quantity}`).join(", ")}</p>}
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-[#edf2f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#829196]">Total</p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[#102c38]">{formatCurrency(transaction.total)}</p>
        </div>
        <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0d8278] px-5 text-sm font-bold text-white transition-colors hover:bg-[#096e67]" href={`/admin/transactions/${transaction.id}`}>
          {transaction.status === "confirmed" ? "Complete transaction" : "Review"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function RecentSubmissions({ transactions }: { transactions: AdminTransaction[] }) {
  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="recent-submissions">
      <div className="flex flex-col gap-3 border-b border-[#dce8e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><Clock className="h-4 w-4" /></span>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#10222e]">Recent submissions</h2>
            <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">The latest customer requests, newest first.</p>
          </div>
        </div>
        <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5d7475] sm:self-auto">{transactions.length} shown</span>
      </div>

      <div className="mt-5 space-y-3">
        {transactions.length > 0 ? transactions.map((transaction) => (
          <Link className="flex flex-col gap-3 rounded-2xl border border-[#dce8e4] bg-white p-4 transition-colors hover:border-[#9acdc3] sm:flex-row sm:items-center sm:justify-between" href={`/admin/transactions/${transaction.id}`} key={transaction.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black tracking-[0.06em] text-[#102c38]">{transaction.transactionNumber}</p>
                <StatusBadge status={transaction.status} />
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-[#486168]">{transaction.customerName} · {vehicleLabel(transaction)}</p>
              <p className="mt-1 text-xs text-[#829196]">{formatDateTime(transaction.createdAt)}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <p className="text-sm font-black text-[#18323c]">{formatCurrency(transaction.total)}</p>
              <ArrowRight className="h-4 w-4 text-[#0d8278]" />
            </div>
          </Link>
        )) : <p className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-6 text-sm leading-6 text-[#6b7b7f]">No submissions yet.</p>}
      </div>
    </section>
  );
}

export function AdminTransactionDashboard({ data }: { data: AdminTransactionDashboardData }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="incoming-check-ins">
        <div className="flex flex-col gap-5 border-b border-[#dce8e4] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><ClipboardCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Incoming Check-Ins</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#10222e]">Review customer requests.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7b7f]">Requests arrive here as pending. Review the details before accepting or cancelling them.</p>
            </div>
          </div>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cbdcd8] bg-white px-4 text-sm font-bold text-[#28424d] transition-colors hover:border-[#9acdc3] hover:bg-[#f8fbfa]" href="#recent-submissions">View recent submissions<ArrowRight className="h-4 w-4" /></a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MetricCard detail="Awaiting admin review" label="Pending requests" tone="amber" value={data.pendingCount} />
          <MetricCard detail="Accepted requests, not completed" label="Confirmed requests" tone="teal" value={data.confirmedCount} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ac7121]" />
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#607378]">Pending requests</h3>
            </div>
            <span className="text-xs font-semibold text-[#829196]">Newest first</span>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {data.pendingRequests.length > 0 ? data.pendingRequests.map((transaction) => <RequestCard key={transaction.id} transaction={transaction} />) : <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-7 text-sm leading-6 text-[#6b7b7f]">No pending check-ins right now.</div>}
          </div>
        </div>

        <div className="mt-8 border-t border-[#dce8e4] pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#0d8278]" />
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#607378]">Ready / confirmed</h3>
            </div>
            <span className="text-xs font-semibold text-[#829196]">Complete after service</span>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {data.confirmedRequests.length > 0 ? data.confirmedRequests.map((transaction) => <RequestCard key={transaction.id} transaction={transaction} />) : <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-7 text-sm leading-6 text-[#6b7b7f]">No confirmed transactions are waiting for completion.</div>}
          </div>
        </div>
      </section>

      <RecentSubmissions transactions={data.recentSubmissions} />

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196]">
        <CheckCircle className="h-4 w-4 text-[#0d9f91]" />
        Only completed transactions post sales and deduct inventory.
      </p>
    </div>
  );
}
