import Link from "next/link";

import { ArrowRight, ChartLine, CheckCircle, Clock, Sparkles } from "@/components/icons";
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
    <div className="rounded-2xl border border-[#dfddd4] bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.045em] text-[#171717] sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#65635d]">{detail}</p>
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
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#dfddd4] pb-5 lg:flex-row lg:items-end lg:justify-between">
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

      <div className="mt-5 flex flex-wrap gap-2">
        {filterLinks.map((filter) => (
          <Link
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors ${selection.key === filter.key ? "bg-[#f4c400] text-[#171717]" : "border border-[#d7d4ca] bg-white text-[#4a4945] hover:border-[#d4b900] hover:text-[#a77f00]"}`}
            href={`/admin/sales?range=${filter.key}`}
            key={filter.key}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <form action="/admin/sales" aria-describedby={selection.error ? "sales-range-error" : undefined} className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#dfddd4] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end" method="get">
        <input name="range" type="hidden" value="custom" />
        <div className="min-w-0 flex-1 sm:min-w-40">
          <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#65635d]" htmlFor="sales-from">From</label>
          <input aria-describedby={selection.error ? "sales-range-error" : undefined} aria-invalid={Boolean(selection.error)} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm text-[#292929] outline-none focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]" defaultValue={selection.fromValue} id="sales-from" name="from" type="date" />
        </div>
        <div className="min-w-0 flex-1 sm:min-w-40">
          <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#65635d]" htmlFor="sales-to">To</label>
          <input aria-describedby={selection.error ? "sales-range-error" : undefined} aria-invalid={Boolean(selection.error)} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d7d4ca] bg-white px-3.5 text-sm text-[#292929] outline-none focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]" defaultValue={selection.toValue} id="sales-to" name="to" type="date" />
        </div>
        <button className="min-h-11 rounded-xl bg-[#171717] px-5 text-sm font-bold text-white transition-colors hover:bg-[#343434]" type="submit">Apply custom range</button>
      </form>

      {selection.error && <p className="mt-3 rounded-xl border border-[#f0d3c8] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[#9f4c47]" id="sales-range-error" role="alert">{selection.error}</p>}
    </section>
  );
}

function SalesTrend({ points }: { points: SalesReport["trend"] }) {
  if (points.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">No completed transactions found for this period.</p>;
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
    return <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">No completed transactions found for this period.</p>;
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

function lineLabel(name: string, quantity: number) {
  return quantity > 1 ? `${name} x${quantity}` : name;
}

function TransactionTable({ report }: { report: SalesReport }) {
  if (report.transactions.length === 0) {
    const message = report.summary.completedTransactions === 0
      ? "No completed sales yet."
      : "No completed transactions found for this period.";

    return <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-7 text-sm leading-6 text-[#65635d]">{message}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dfddd4] bg-white">
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
  );
}

function SalesHeader() {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Sales reporting</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">Completed work, clearly accounted for.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#65635d]">Sales activity is recognized at completion and uses the historical transaction snapshots stored at check-in.</p>
      </div>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff7cc] text-[#a77f00] ring-1 ring-[#ead98a]">
        <ChartLine className="h-8 w-8" />
      </div>
    </header>
  );
}

export function AdminSalesDashboard({ report, selection }: { report: SalesReport | null; selection: SalesFilterSelection }) {
  if (!report) {
    return (
      <div className="space-y-8">
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
  const hasFilteredSales = report.filtered.completedTransactions > 0;

  return (
    <div className="space-y-8">
      <SalesHeader />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard detail="All time, completed transactions only" label="Total Sales" value={formatAmount(report.summary.totalSales, report.summary.completedTransactions)} />
        <SummaryCard detail="Completed in Asia/Manila today" label="Sales Today" value={formatAmount(report.summary.salesToday, report.summary.completedTransactions)} />
        <SummaryCard detail="Completed in the current Manila month" label="Sales This Month" value={formatAmount(report.summary.salesThisMonth, report.summary.completedTransactions)} />
        <SummaryCard detail="All completed transactions" label="Completed Transactions" value={report.summary.completedTransactions} />
      </section>

      <FilterControls selection={selection} />

      <section className="rounded-[1.5rem] border border-[#ead98a] bg-[#fff7cc] p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#ead98a] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Selected period</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">{selection.label} totals</h2>
          </div>
          <span className="text-sm font-semibold text-[#6f652f]">Based on completed_at</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard detail="Completed transaction totals" label="Filtered Sales" value={formatAmount(report.filtered.sales, report.filtered.completedTransactions)} />
          <SummaryCard detail="Completed in this period" label="Completed Transactions" value={report.filtered.completedTransactions} />
          <SummaryCard detail="Filtered sales divided by completed transactions" label="Average Transaction Value" value={formatAmount(report.filtered.averageTransactionValue, report.filtered.completedTransactions)} />
        </div>
      </section>

      {!hasCompletedSales && (
        <section className="flex items-start gap-4 rounded-2xl border border-dashed border-[#cfcac0] bg-[#fff9d9] p-5 sm:p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a77f00] shadow-sm"><CheckCircle className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-bold text-[#171717]">No completed sales yet.</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f652f]">Completed transactions will appear here after the operational completion step succeeds.</p>
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><ChartLine className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Daily trend</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Sales by completed date</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Daily totals for the selected period, interpreted in Asia/Manila.</p>
            </div>
          </div>
          <div className="mt-5"><SalesTrend points={report.trend} /></div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Service sales</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Contribution by service</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Grouped by historical service snapshot name.</p>
            </div>
          </div>
          <div className="mt-5"><SalesBreakdown emptyMessage="No service sales for this period." items={report.serviceSales} /></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Sparkles className="h-4 w-4" /></span>
            <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Shop product sales</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Contribution by product</h2>
            <p className="mt-1 text-sm leading-6 text-[#65635d]">Grouped by historical product snapshot name.</p>
            </div>
          </div>
          <div className="mt-5"><SalesBreakdown emptyMessage="No shop product sales for this period." items={report.productSales} /></div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f1eb] text-[#171717]"><ChartLine className="h-4 w-4" /></span>
            <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#756000]">Vehicle category</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Completed transaction mix</h2>
            <p className="mt-1 text-sm leading-6 text-[#65635d]">Uses the category snapshot stored on each transaction.</p>
            </div>
          </div>
          <div className="mt-5"><VehicleCategorySummary items={report.vehicleCategories} /></div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Clock className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Sales activity</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Completed transactions</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Newest completed transactions first. Select a transaction number to view its protected detail page.</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] sm:self-auto">{report.transactions.length} shown</span>
        </div>
        <div className="mt-5"><TransactionTable report={report} /></div>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#cfcac0] bg-[#fff9d9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Operational handoff</p>
          <p className="mt-1 text-sm leading-6 text-[#6f652f]">Incoming and confirmed requests remain on the operations dashboard until completion.</p>
        </div>
        <Link className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-xs font-bold text-[#a77f00] shadow-sm transition-colors hover:bg-[#fffdf2] sm:self-auto" href="/admin">
          Open operations dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!hasFilteredSales && hasCompletedSales && <p className="text-center text-xs font-semibold text-[#89867d]">No completed transactions found for this period.</p>}
    </div>
  );
}
