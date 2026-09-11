import Link from "next/link";

import { ChartLine, CheckCircle, Clock, Sparkles, Users } from "@/components/icons";
import type { SalesFilterSelection, SalesReport } from "@/lib/sales/data";

function formatPeso(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmount(value: number, completedCount: number) {
  return completedCount > 0 ? formatPeso(value) : "No data";
}

function formatCompletedDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function formatBusinessDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Manila",
  });
}

function SummaryCard({ detail, label, value }: { detail: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#dfddd4] bg-white p-4 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.045em] text-[#171717] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#65635d]">{detail}</p>
    </div>
  );
}

function FilterControls({ selection }: { selection: SalesFilterSelection }) {
  const filterLinks = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ] as const;

  return (
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-4 sm:gap-4 sm:pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Sales period</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">{selection.label}</h2>
          <p className="mt-1 text-sm leading-6 text-[#65635d]">Filters use the completed timestamp and Philippine business dates.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] shadow-sm lg:self-auto">
          <Clock className="h-3.5 w-3.5 text-[#a77f00]" />
          Completed transactions only
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
        {filterLinks.map((filter) => (
          <Link
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors sm:px-4 ${selection.key === filter.key ? "bg-[#f4c400] text-[#171717]" : "border border-[#d7d4ca] bg-white text-[#4a4945] hover:border-[#d4b900] hover:text-[#a77f00]"}`}
            href={`/admin/sales?range=${filter.key}`}
            key={filter.key}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <form action="/admin/sales" aria-describedby={selection.error ? "sales-range-error" : undefined} className="mt-3 flex flex-col gap-3 rounded-2xl border border-[#dfddd4] bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end sm:p-4" method="get">
        <input name="range" type="hidden" value="custom" />
        <div className="min-w-0 flex-1 sm:min-w-40">
          <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#65635d]" htmlFor="sales-from">From</label>
          <input aria-describedby={selection.error ? "sales-range-error" : undefined} aria-invalid={Boolean(selection.error)} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm text-[#292929] outline-none focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]" defaultValue={selection.fromValue} id="sales-from" name="from" type="date" />
        </div>
        <div className="min-w-0 flex-1 sm:min-w-40">
          <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#65635d]" htmlFor="sales-to">To</label>
          <input aria-describedby={selection.error ? "sales-range-error" : undefined} aria-invalid={Boolean(selection.error)} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm text-[#292929] outline-none focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]" defaultValue={selection.toValue} id="sales-to" name="to" type="date" />
        </div>
        <button className="min-h-11 w-full rounded-xl bg-[#171717] px-5 text-sm font-bold text-white transition-colors hover:bg-[#343434] sm:w-auto" type="submit">Apply custom range</button>
      </form>

      {selection.error && <p className="mt-3 rounded-xl border border-[#f0d3c8] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[#9f4c47]" id="sales-range-error" role="alert">{selection.error}</p>}
    </section>
  );
}

function SalesTrend({ points }: { points: SalesReport["trend"] }) {
  if (points.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm leading-6 text-[#65635d]">No completed transactions found for this period.</p>;
  }

  const maximum = Math.max(...points.map((point) => point.total), 1);

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
      {points.map((point) => (
        <div className="rounded-xl border border-[#e8e5dc] bg-white p-3" key={point.date}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="font-bold text-[#4a4945]">{formatBusinessDate(point.date)}</p>
            <p className="font-black text-[#292929]">{formatPeso(point.total)}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eeeade]">
            <div className="h-full rounded-full bg-[#f4c400]" style={{ width: `${Math.max((point.total / maximum) * 100, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesBreakdown({ items, emptyMessage }: { items: SalesReport["serviceSales"] | SalesReport["productSales"]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e8e5dc] bg-white px-4 py-3" key={item.name}>
          <p className="min-w-0 truncate text-sm font-semibold text-[#4a4945]">{item.name}</p>
          <p className="shrink-0 text-sm font-black text-[#292929]">{formatPeso(item.total)}</p>
        </div>
      ))}
    </div>
  );
}

function VehicleCategorySummary({ items }: { items: SalesReport["vehicleCategories"] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm leading-6 text-[#65635d]">No completed transactions found for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e8e5dc] bg-white px-4 py-3" key={item.name}>
          <p className="text-sm font-semibold text-[#4a4945]">{item.name}</p>
          <p className="shrink-0 text-sm font-black text-[#292929]">{item.transactions} transaction{item.transactions === 1 ? "" : "s"}</p>
        </div>
      ))}
    </div>
  );
}

function StaffEarningsSummary({ items }: { items: SalesReport["staffEarnings"] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm leading-6 text-[#65635d]">No staff earnings recorded for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="flex flex-col gap-2 rounded-xl border border-[#e8e5dc] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between" key={item.staffId}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-words text-sm font-semibold text-[#4a4945]">{item.name}</p>
              {!item.active && <span className="rounded-full bg-[#eef0eb] px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#78766f]">Inactive</span>}
            </div>
            <p className="mt-1 text-xs text-[#89867d]">{item.completedTransactions} completed transaction{item.completedTransactions === 1 ? "" : "s"}</p>
          </div>
          <p className="shrink-0 text-sm font-black text-[#292929]">{formatPeso(item.earnings)}</p>
        </div>
      ))}
    </div>
  );
}

function lineLabel(name: string, quantity: number) {
  return quantity > 1 ? `${name} x${quantity}` : name;
}

function salesHref(selection: SalesFilterSelection, page: number) {
  const params = new URLSearchParams();

  if (selection.key !== "all") {
    params.set("range", selection.key);
  }

  if (selection.key === "custom") {
    if (selection.fromValue) params.set("from", selection.fromValue);
    if (selection.toValue) params.set("to", selection.toValue);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/sales?${query}` : "/admin/sales";
}

function TransactionPagination({ pagination, selection }: { pagination: SalesReport["transactionPagination"]; selection: SalesFilterSelection }) {
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
      <nav aria-label="Completed transactions pagination" className="flex flex-wrap items-center gap-2">
        {pagination.page > 1 ? (
          <Link className="inline-flex min-h-10 items-center rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm font-bold text-[#4a4945] transition-colors hover:border-[#d4b900] hover:text-[#a77f00]" href={salesHref(selection, pagination.page - 1)}>Previous</Link>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-xl border border-[#ebe9e2] bg-white px-3.5 text-sm font-bold text-[#b0ada4]">Previous</span>
        )}
        <span className="px-2 text-sm font-bold text-[#65635d]">Page {pagination.page} of {pagination.totalPages}</span>
        {pagination.page < pagination.totalPages ? (
          <Link className="inline-flex min-h-10 items-center rounded-xl bg-[#f4c400] px-3.5 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href={salesHref(selection, pagination.page + 1)}>Next</Link>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-xl bg-[#e4e2da] px-3.5 text-sm font-bold text-[#89867d]">Next</span>
        )}
      </nav>
    </div>
  );
}

function TransactionTable({ report, selection }: { report: SalesReport; selection: SalesFilterSelection }) {
  if (report.transactions.length === 0) {
    const message = report.summary.completedTransactions === 0
      ? "No completed sales yet."
      : "No completed transactions found for this period.";

    return <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">{message}</div>;
  }

  return (
    <>
      <div className="max-w-full overflow-x-auto rounded-2xl border border-[#dfddd4] bg-white">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead className="bg-[#f7f6f1] text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#65635d]">
            <tr>
              <th className="px-4 py-4">Transaction</th>
              <th className="px-4 py-4">Completed</th>
              <th className="px-4 py-4">Customer</th>
              <th className="px-4 py-4">Vehicle</th>
              <th className="px-4 py-4">Services</th>
              <th className="px-4 py-4">Products</th>
              <th className="px-4 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e5dc]">
            {report.transactions.map((transaction) => (
              <tr className="align-top transition-colors hover:bg-[#fffdf2]" key={transaction.id}>
                <td className="px-4 py-4">
                  <Link className="text-sm font-black tracking-[0.03em] text-[#a77f00] hover:text-[#756000]" href={`/admin/transactions/${transaction.id}`}>
                    {transaction.transactionNumber}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-[#65635d]">{formatCompletedDate(transaction.completedAt)}</td>
                <td className="px-4 py-4 text-sm font-semibold text-[#3f3f3f]">{transaction.customerName}</td>
                <td className="px-4 py-4 text-sm text-[#65635d]">
                  <p className="font-semibold text-[#3f3f3f]">{transaction.vehicleCategory}</p>
                  <p className="mt-1 text-xs">{transaction.plateNumber ?? "Plate not provided"}</p>
                </td>
                <td className="px-4 py-4 text-sm text-[#65635d]">
                  {transaction.services.length > 0 ? transaction.services.map((line, index) => <p key={`${line.name}-${index}`}>{lineLabel(line.name, line.quantity)}</p>) : <span className="text-[#9a978d]">No services</span>}
                </td>
                <td className="px-4 py-4 text-sm text-[#65635d]">
                  {transaction.products.length > 0 ? transaction.products.map((line, index) => <p key={`${line.name}-${index}`}>{lineLabel(line.name, line.quantity)}</p>) : <span className="text-[#9a978d]">No products</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-[#292929]">{formatPeso(transaction.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TransactionPagination pagination={report.transactionPagination} selection={selection} />
    </>
  );
}

function SalesHeader() {
  return (
    <div className="flex justify-end">
      <h1 className="sr-only">Sales</h1>
      <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm font-bold text-[#292929] shadow-sm transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc]" href="/admin/sales/staff">
        <Users className="h-4 w-4 text-[#a77f00]" />
        Manage staff
      </Link>
    </div>
  );
}

export function AdminSalesDashboard({ report, selection }: { report: SalesReport | null; selection: SalesFilterSelection }) {
  if (!report) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <SalesHeader />
        <FilterControls selection={selection} />
        <section aria-labelledby="sales-report-error-title" className="rounded-2xl border border-[#f0d3c8] bg-[#fff8f6] p-6" role="alert">
          <h2 className="text-lg font-bold text-[#6f3333]" id="sales-report-error-title">Choose a valid sales period.</h2>
          <p className="mt-2 text-sm leading-6 text-[#9f4c47]">Correct the custom date range above to load the sales report.</p>
        </section>
      </div>
    );
  }

  const hasCompletedSales = report.summary.completedTransactions > 0;
  return (
    <div className="space-y-5 sm:space-y-6">
      <SalesHeader />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <SummaryCard detail="All time, completed transactions only" label="Total Sales" value={formatAmount(report.summary.totalSales, report.summary.completedTransactions)} />
        <SummaryCard detail="Completed in Asia/Manila today" label="Sales Today" value={formatAmount(report.summary.salesToday, report.summary.completedTransactions)} />
        <SummaryCard detail="Completed in the current Manila month" label="Sales This Month" value={formatAmount(report.summary.salesThisMonth, report.summary.completedTransactions)} />
        <SummaryCard detail="All completed transactions" label="Completed Transactions" value={report.summary.completedTransactions} />
        <SummaryCard detail="60% of completed service sales" label="Company Service Sales" value={formatAmount(report.summary.companyServiceSales, report.summary.completedTransactions)} />
        <SummaryCard detail="40% allocated from completed service sales" label="Staff Earnings" value={formatAmount(report.summary.staffEarnings, report.summary.completedTransactions)} />
      </section>

      <FilterControls selection={selection} />

      <section className="rounded-[1.5rem] border border-[#ead98a] bg-[#fff7cc] p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#ead98a] pb-4 sm:pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Selected period</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">{selection.label} totals</h2>
          </div>
          <span className="text-sm font-semibold text-[#6f652f]">Based on completed_at</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard detail="Completed transaction totals" label="Filtered Sales" value={formatAmount(report.filtered.sales, report.filtered.completedTransactions)} />
          <SummaryCard detail="Completed in this period" label="Completed Transactions" value={report.filtered.completedTransactions} />
          <SummaryCard detail="Filtered sales divided by completed transactions" label="Average Transaction Value" value={formatAmount(report.filtered.averageTransactionValue, report.filtered.completedTransactions)} />
          <SummaryCard detail="60% of filtered service sales" label="Company Service Sales" value={formatAmount(report.filtered.companyServiceSales, report.filtered.completedTransactions)} />
          <SummaryCard detail="40% of filtered service sales" label="Staff Earnings" value={formatAmount(report.filtered.staffEarnings, report.filtered.completedTransactions)} />
        </div>
      </section>

      {!hasCompletedSales && (
        <section className="flex items-start gap-4 rounded-2xl border border-dashed border-[#cfcac0] bg-[#fff9d9] p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a77f00] shadow-sm"><CheckCircle className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-bold text-[#171717]">No completed sales yet.</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f652f]">Completed transactions will appear here when the completion step succeeds.</p>
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><ChartLine className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Daily trend</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Sales by completed date</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Daily totals for the selected period, interpreted in Asia/Manila.</p>
            </div>
          </div>
          <div className="mt-4"><SalesTrend points={report.trend} /></div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Service sales</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Contribution by service</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Grouped by historical service snapshot name.</p>
            </div>
          </div>
          <div className="mt-4"><SalesBreakdown emptyMessage="No service sales for this period." items={report.serviceSales} /></div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Shop product sales</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Contribution by product</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Grouped by historical product snapshot name.</p>
            </div>
          </div>
          <div className="mt-4"><SalesBreakdown emptyMessage="No shop product sales for this period." items={report.productSales} /></div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f1eb] text-[#171717]"><ChartLine className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#756000]">Vehicle category</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Completed transaction mix</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Uses the category snapshot stored on each transaction.</p>
            </div>
          </div>
          <div className="mt-4"><VehicleCategorySummary items={report.vehicleCategories} /></div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Users className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Staff earnings</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Selected-period allocation</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">The list follows the selected completed-date filter and uses each assignment&apos;s completion snapshot.</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] sm:self-auto">40% staff allocation</span>
        </div>
        <div className="mt-4"><StaffEarningsSummary items={report.staffEarnings} /></div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-4 sm:pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Clock className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Sales activity</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Completed transactions</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Newest completed transactions first. Select a transaction number to view its protected detail page.</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] sm:self-auto">{report.transactions.length} of {report.transactionPagination.totalItems}</span>
        </div>
        <div className="mt-4"><TransactionTable report={report} selection={selection} /></div>
      </section>
    </div>
  );
}
