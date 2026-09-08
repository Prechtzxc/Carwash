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
    <div className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)]">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#829196]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.045em] text-[#102c38] sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6b7b7f]">{detail}</p>
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
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#dce8e4] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Sales period</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">{selection.label}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Filters use the completed timestamp and Philippine business dates.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#52706e] shadow-sm lg:self-auto">
          <Clock className="h-3.5 w-3.5 text-[#0d8278]" />
          Completed transactions only
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filterLinks.map((filter) => (
          <Link
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors ${selection.key === filter.key ? "bg-[#0d8278] text-white" : "border border-[#d7e5e0] bg-white text-[#486168] hover:border-[#a8cfc5] hover:text-[#0d8278]"}`}
            href={`/admin/sales?range=${filter.key}`}
            key={filter.key}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <form action="/admin/sales" className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#dce8e4] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end" method="get">
        <input name="range" type="hidden" value="custom" />
        <div className="min-w-0 flex-1 sm:min-w-40">
          <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#607378]" htmlFor="sales-from">From</label>
          <input className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d7e5e0] bg-white px-3.5 text-sm text-[#18323c] outline-none focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb]" defaultValue={selection.fromValue} id="sales-from" name="from" type="date" />
        </div>
        <div className="min-w-0 flex-1 sm:min-w-40">
          <label className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#607378]" htmlFor="sales-to">To</label>
          <input className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d7e5e0] bg-white px-3.5 text-sm text-[#18323c] outline-none focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb]" defaultValue={selection.toValue} id="sales-to" name="to" type="date" />
        </div>
        <button className="min-h-11 rounded-xl bg-[#102c38] px-5 text-sm font-bold text-white transition-colors hover:bg-[#183d4b]" type="submit">Apply custom range</button>
      </form>

      {selection.error && <p className="mt-3 rounded-xl border border-[#f0d3c8] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[#9f4c47]">{selection.error}</p>}
    </section>
  );
}

function SalesTrend({ points }: { points: SalesReport["trend"] }) {
  if (points.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#b9d4ce] bg-white p-5 text-sm leading-6 text-[#6b7b7f]">No completed transactions found for this period.</p>;
  }

  const maximum = Math.max(...points.map((point) => point.total), 1);

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
      {points.map((point) => (
        <div className="rounded-xl border border-[#edf2f0] bg-white p-3" key={point.date}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="font-bold text-[#486168]">{formatBusinessDate(point.date)}</p>
            <p className="font-black text-[#18323c]">{formatPeso(point.total)}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9f2ef]">
            <div className="h-full rounded-full bg-[#0d8278]" style={{ width: `${Math.max((point.total / maximum) * 100, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesBreakdown({ items, emptyMessage }: { items: SalesReport["serviceSales"] | SalesReport["productSales"]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#b9d4ce] bg-white p-5 text-sm leading-6 text-[#6b7b7f]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#edf2f0] bg-white px-4 py-3" key={item.name}>
          <p className="min-w-0 truncate text-sm font-semibold text-[#486168]">{item.name}</p>
          <p className="shrink-0 text-sm font-black text-[#18323c]">{formatPeso(item.total)}</p>
        </div>
      ))}
    </div>
  );
}

function VehicleCategorySummary({ items }: { items: SalesReport["vehicleCategories"] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#b9d4ce] bg-white p-5 text-sm leading-6 text-[#6b7b7f]">No completed transactions found for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#edf2f0] bg-white px-4 py-3" key={item.name}>
          <p className="text-sm font-semibold text-[#486168]">{item.name}</p>
          <p className="shrink-0 text-sm font-black text-[#18323c]">{item.transactions} transaction{item.transactions === 1 ? "" : "s"}</p>
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

    return <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-7 text-sm leading-6 text-[#6b7b7f]">{message}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dce8e4] bg-white">
      <table className="min-w-[980px] w-full border-collapse text-left">
        <thead className="bg-[#f4f8f7] text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#607378]">
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
        <tbody className="divide-y divide-[#edf2f0]">
          {report.transactions.map((transaction) => (
            <tr className="align-top transition-colors hover:bg-[#fbfdfc]" key={transaction.id}>
              <td className="px-4 py-4">
                <Link className="text-sm font-black tracking-[0.03em] text-[#0d8278] hover:text-[#096e67]" href={`/admin/transactions/${transaction.id}`}>
                  {transaction.transactionNumber}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-[#607378]">{formatCompletedDate(transaction.completedAt)}</td>
              <td className="px-4 py-4 text-sm font-semibold text-[#36525a]">{transaction.customerName}</td>
              <td className="px-4 py-4 text-sm text-[#607378]">
                <p className="font-semibold text-[#36525a]">{transaction.vehicleCategory}</p>
                <p className="mt-1 text-xs">{transaction.plateNumber ?? "Plate not provided"}</p>
              </td>
              <td className="px-4 py-4 text-sm text-[#607378]">
                {transaction.services.length > 0 ? transaction.services.map((line, index) => <p key={`${line.name}-${index}`}>{lineLabel(line.name, line.quantity)}</p>) : <span className="text-[#9aa9aa]">No services</span>}
              </td>
              <td className="px-4 py-4 text-sm text-[#607378]">
                {transaction.products.length > 0 ? transaction.products.map((line, index) => <p key={`${line.name}-${index}`}>{lineLabel(line.name, line.quantity)}</p>) : <span className="text-[#9aa9aa]">No products</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-[#18323c]">{formatPeso(transaction.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSalesDashboard({ report, selection }: { report: SalesReport; selection: SalesFilterSelection }) {
  const hasCompletedSales = report.summary.completedTransactions > 0;
  const hasFilteredSales = report.filtered.completedTransactions > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Sales reporting</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e] sm:text-4xl">Completed work, clearly accounted for.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#64757a]">Sales activity is recognized at completion and uses the historical transaction snapshots stored at check-in.</p>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#dff6f0] text-[#0d8278] ring-1 ring-[#c7ebe3]">
          <ChartLine className="h-8 w-8" />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard detail="All time, completed transactions only" label="Total Sales" value={formatAmount(report.summary.totalSales, report.summary.completedTransactions)} />
        <SummaryCard detail="Completed in Asia/Manila today" label="Sales Today" value={formatAmount(report.summary.salesToday, report.summary.completedTransactions)} />
        <SummaryCard detail="Completed in the current Manila month" label="Sales This Month" value={formatAmount(report.summary.salesThisMonth, report.summary.completedTransactions)} />
        <SummaryCard detail="All completed transactions" label="Completed Transactions" value={report.summary.completedTransactions} />
      </section>

      <FilterControls selection={selection} />

      <section className="rounded-[1.5rem] border border-[#ccebe3] bg-[#e9f8f4] p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#ccebe3] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Selected period</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">{selection.label} totals</h2>
          </div>
          <span className="text-sm font-semibold text-[#52706e]">Based on completed_at</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard detail="Completed transaction totals" label="Filtered Sales" value={formatAmount(report.filtered.sales, report.filtered.completedTransactions)} />
          <SummaryCard detail="Completed in this period" label="Completed Transactions" value={report.filtered.completedTransactions} />
          <SummaryCard detail="Filtered sales divided by completed transactions" label="Average Transaction Value" value={formatAmount(report.filtered.averageTransactionValue, report.filtered.completedTransactions)} />
        </div>
      </section>

      {!hasCompletedSales && (
        <section className="flex items-start gap-4 rounded-2xl border border-dashed border-[#b9d4ce] bg-[#edf8f5] p-5 sm:p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0d8278] shadow-sm"><CheckCircle className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-bold text-[#10222e]">No completed sales yet.</h2>
            <p className="mt-1 text-sm leading-6 text-[#4f6d6c]">Completed transactions will appear here after the operational completion step succeeds.</p>
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dce8e4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><ChartLine className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Daily trend</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Sales by completed date</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Daily totals for the selected period, interpreted in Asia/Manila.</p>
            </div>
          </div>
          <div className="mt-5"><SalesTrend points={report.trend} /></div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dce8e4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Service sales</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Contribution by service</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Grouped by historical service snapshot name.</p>
            </div>
          </div>
          <div className="mt-5"><SalesBreakdown emptyMessage="No service sales for this period." items={report.serviceSales} /></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dce8e4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0d4] text-[#ac7121]"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#ac7121]">Shop product sales</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Contribution by product</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Grouped by historical product snapshot name.</p>
            </div>
          </div>
          <div className="mt-5"><SalesBreakdown emptyMessage="No shop product sales for this period." items={report.productSales} /></div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#dce8e4] pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6edff] text-[#4966a4]"><ChartLine className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#4966a4]">Vehicle category</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Completed transaction mix</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Uses the category snapshot stored on each transaction.</p>
            </div>
          </div>
          <div className="mt-5"><VehicleCategorySummary items={report.vehicleCategories} /></div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#dce8e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><Clock className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Sales activity</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">Completed transactions</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Newest completed transactions first. Select a transaction number to view its protected detail page.</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5d7475] sm:self-auto">{report.transactions.length} shown</span>
        </div>
        <div className="mt-5"><TransactionTable report={report} /></div>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#b9d4ce] bg-[#edf8f5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Operational handoff</p>
          <p className="mt-1 text-sm leading-6 text-[#4f6d6c]">Incoming and confirmed requests remain on the operations dashboard until completion.</p>
        </div>
        <Link className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-xs font-bold text-[#0d8278] shadow-sm transition-colors hover:bg-[#f7fffc] sm:self-auto" href="/admin">
          Open operations dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!hasFilteredSales && hasCompletedSales && <p className="text-center text-xs font-semibold text-[#829196]">No completed transactions found for this period.</p>}
    </div>
  );
}
