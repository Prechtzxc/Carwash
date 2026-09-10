"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  ArrowRight,
  Boxes,
  CheckCircle,
  Layers,
  Sparkles,
} from "@/components/icons";
import {
  applyInventoryMovementAction,
  saveInventoryItemAction,
  toggleInventoryItemAction,
  type InventoryActionState,
} from "@/app/admin/(protected)/inventory/actions";
import { initialFormActionState } from "@/lib/form-action-state";
import type {
  InventoryData,
  InventoryFilters,
  InventoryItemDto,
  InventoryItemOptionDto,
  InventoryMovementDto,
  InventoryPagination,
} from "@/lib/inventory/data";
import {
  inventoryItemTypeLabels,
  inventoryItemTypes,
  inventoryMovementTypeLabels,
  inventoryMovementTypes,
  inventoryStockStatusLabels,
  inventoryUnits,
  inventoryUnitLabels,
  manualInventoryMovementTypes,
  type InventoryStockStatus,
} from "@/types/inventory";

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#d7e5e0] bg-white px-3.5 text-sm text-[#18323c] shadow-sm outline-none transition-colors placeholder:text-[#9aa9aa] focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#607378]";

type InventoryManagerProps = InventoryData;

function formatQuantity(value: number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Unavailable";
  }

  return amount.toFixed(3).replace(/\.?(0+)$/, "");
}

function formatPrice(value: number | null) {
  if (value === null) {
    return "Not applicable";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? `PHP ${amount.toFixed(2)}` : "Unavailable";
}

function formatPriceInput(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return `${date.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })} ${date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })} PHT`;
}

type StockStatus = InventoryStockStatus;

function getStockStatus(item: InventoryItemDto): StockStatus {
  if (item.stock_status === "in_stock" || item.stock_status === "low_stock" || item.stock_status === "out_of_stock") {
    return item.stock_status;
  }

  const currentStock = Number(item.current_stock);
  const minimumStock = Number(item.minimum_stock);

  if (currentStock <= 0) {
    return "out_of_stock";
  }

  if (currentStock <= minimumStock) {
    return "low_stock";
  }

  return "in_stock";
}

const stockStatusLabels = inventoryStockStatusLabels;

const stockStatusStyles: Record<StockStatus, { badge: string; dot: string }> = {
  in_stock: { badge: "bg-[#e1f6f0] text-[#0d8278]", dot: "bg-[#17a190]" },
  low_stock: { badge: "bg-[#fff3d8] text-[#a36c1b]", dot: "bg-[#d49a38]" },
  out_of_stock: { badge: "bg-[#fff0ed] text-[#b34646]", dot: "bg-[#d4665f]" },
};

function StockStatusBadge({ status }: { status: StockStatus }) {
  const styles = stockStatusStyles[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${styles.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {stockStatusLabels[status]}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${active ? "bg-[#e1f6f0] text-[#0d8278]" : "bg-[#eef1f0] text-[#78878a]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#17a190]" : "bg-[#9aa7a6]"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ActionFeedback({ state }: { state: InventoryActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={`text-xs font-semibold ${state.status === "success" ? "text-[#0d8278]" : "text-[#b34646]"}`}
    >
      {state.message}
    </p>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 text-xs font-semibold text-[#b34646]" id={id}>
      {message}
    </p>
  );
}

function SubmitButton({ children, pendingLabel = "Saving..." }: { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0d8278] px-4 text-sm font-bold text-white transition-colors hover:bg-[#096e67] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function CompactSubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-9 rounded-lg bg-[#0d8278] px-3 text-xs font-bold text-white transition-colors hover:bg-[#096e67] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function SectionHeading({ index, title, description, count }: { index: string; title: string; description: string; count: number }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#dce8e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-xs font-black text-[#0d8278]">
          {index}
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[#10222e]">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6b7b7f]">{description}</p>
        </div>
      </div>
      <span className="self-start rounded-full bg-[#f1f6f4] px-3 py-1.5 text-xs font-bold text-[#5d7475] sm:self-auto">
        {count} {count === 1 ? "record" : "records"}
      </span>
    </div>
  );
}

function InventoryItemStatusToggle({ id, active }: { id: string; active: boolean }) {
  const [state, formAction] = useActionState(toggleInventoryItemAction, initialFormActionState);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={formAction}>
        <input name="id" type="hidden" value={id} />
        <input name="active" type="hidden" value={String(!active)} />
        <CompactSubmitButton pendingLabel="Updating...">
          {active ? "Disable" : "Enable"}
        </CompactSubmitButton>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

function InventoryItemEditor({ item }: { item?: InventoryItemDto }) {
  const [state, formAction] = useActionState(saveInventoryItemAction, initialFormActionState);
  const prefix = item ? `inventory-item-${item.id}` : "new-inventory-item";
  const nameErrorId = `${prefix}-name-error`;
  const typeErrorId = `${prefix}-type-error`;
  const unitErrorId = `${prefix}-unit-error`;
  const minimumStockErrorId = `${prefix}-minimum-stock-error`;
  const sellingPriceErrorId = `${prefix}-selling-price-error`;
  const descriptionErrorId = `${prefix}-description-error`;
  const sortOrderErrorId = `${prefix}-sort-order-error`;
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#0d8278]">
            {item ? "Edit inventory item" : "New inventory item"}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10222e]">
            {item?.name ?? "Add a stock-tracked item"}
          </h3>
        </div>
        {item && (
          <div className="flex flex-col items-end gap-2">
            <ActiveBadge active={item.active} />
            <InventoryItemStatusToggle active={item.active} id={item.id} />
          </div>
        )}
      </div>

      {item && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-[#f4f8f7] px-4 py-3 text-sm">
          <span className="font-semibold text-[#607378]">Current stock (read-only)</span>
          <span className="font-bold text-[#18323c]">{formatQuantity(item.current_stock)} {item.unit}</span>
        </div>
      )}

      <form action={formAction} className="mt-5 space-y-4">
        {item && <input name="id" type="hidden" value={item.id} />}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-name`}>Name</label>
            <input
              aria-describedby={fieldErrors.name ? nameErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.name)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.name ?? ""}
              id={`${prefix}-name`}
              maxLength={120}
              name="name"
              placeholder="e.g. Car Shampoo"
              required
            />
            <FieldError id={nameErrorId} message={fieldErrors.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-sort-order`}>Sort order</label>
            <input
              aria-describedby={fieldErrors.sortOrder ? sortOrderErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.sortOrder)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.sort_order ?? 0}
              id={`${prefix}-sort-order`}
              inputMode="numeric"
              max={9999}
              min={0}
              name="sortOrder"
              required
              step={1}
              type="number"
            />
            <FieldError id={sortOrderErrorId} message={fieldErrors.sortOrder} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-item-type`}>Item type</label>
            <select
              aria-describedby={fieldErrors.itemType ? typeErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.itemType)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.item_type ?? "consumable"}
              id={`${prefix}-item-type`}
              name="itemType"
            >
              {inventoryItemTypes.map((itemType) => (
                <option key={itemType} value={itemType}>{inventoryItemTypeLabels[itemType]}</option>
              ))}
            </select>
            <FieldError id={typeErrorId} message={fieldErrors.itemType} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-unit`}>Base unit</label>
            <select
              aria-describedby={fieldErrors.unit ? unitErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.unit)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.unit ?? "ml"}
              id={`${prefix}-unit`}
              name="unit"
            >
              {inventoryUnits.map((unit) => (
                <option key={unit} value={unit}>{inventoryUnitLabels[unit]}</option>
              ))}
            </select>
            <FieldError id={unitErrorId} message={fieldErrors.unit} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-minimum-stock`}>Minimum stock</label>
            <input
              aria-describedby={fieldErrors.minimumStock ? minimumStockErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.minimumStock)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.minimum_stock ?? 0}
              id={`${prefix}-minimum-stock`}
              inputMode="decimal"
              min={0}
              name="minimumStock"
              required
              step="0.001"
              type="number"
            />
            <FieldError id={minimumStockErrorId} message={fieldErrors.minimumStock} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-selling-price`}>Selling price (PHP)</label>
            <input
              aria-describedby={fieldErrors.sellingPrice ? sellingPriceErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.sellingPrice)}
              className={`${inputClass} mt-2`}
              defaultValue={formatPriceInput(item?.selling_price)}
              id={`${prefix}-selling-price`}
              inputMode="decimal"
              min={0}
              name="sellingPrice"
              placeholder="Required for shop products"
              step="0.01"
              type="number"
            />
            <p className="mt-2 text-xs leading-5 text-[#7b898c]">Leave blank for consumables; shop products require a PHP price.</p>
            <FieldError id={sellingPriceErrorId} message={fieldErrors.sellingPrice} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor={`${prefix}-description`}>Description</label>
          <textarea
            aria-describedby={fieldErrors.description ? descriptionErrorId : undefined}
            aria-invalid={Boolean(fieldErrors.description)}
            className={`${inputClass} mt-2 min-h-24 resize-y py-3`}
            defaultValue={item?.description ?? ""}
            id={`${prefix}-description`}
            maxLength={500}
            name="description"
            placeholder="Optional operator-facing description"
            rows={3}
          />
          <FieldError id={descriptionErrorId} message={fieldErrors.description} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#edf2f0] pt-4">
          <SubmitButton>{item ? "Save item" : "Add item"}</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </article>
  );
}

function StockMovementForm({ item }: { item: InventoryItemDto }) {
  const [state, formAction] = useActionState(applyInventoryMovementAction, initialFormActionState);
  const prefix = `movement-${item.id}`;
  const quantityErrorId = `${prefix}-quantity-error`;
  const notesErrorId = `${prefix}-notes-error`;
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <div className="rounded-2xl border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0d4] text-[#ac7121]">
          <Boxes className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#ac7121]">Stock movement</p>
          <h4 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10222e]">Change {item.name} stock</h4>
          <p className="mt-1 text-sm leading-6 text-[#6b7b7f]">Current stock is updated only through the atomic movement ledger.</p>
        </div>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        <input name="inventoryItemId" type="hidden" value={item.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-type`}>Movement type</label>
            <select className={`${inputClass} mt-2`} defaultValue="stock_in" id={`${prefix}-type`} name="movementType">
              {manualInventoryMovementTypes.map((movementType) => (
                <option key={movementType} value={movementType}>{inventoryMovementTypeLabels[movementType]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-quantity`}>Quantity ({item.unit})</label>
            <input
              aria-describedby={fieldErrors.quantity ? quantityErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.quantity)}
              className={`${inputClass} mt-2`}
              id={`${prefix}-quantity`}
              inputMode="decimal"
              min={0.001}
              name="quantity"
              placeholder="0.000"
              required
              step="0.001"
              type="number"
            />
            <FieldError id={quantityErrorId} message={fieldErrors.quantity} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}-notes`}>Notes</label>
          <textarea
            aria-describedby={fieldErrors.notes ? notesErrorId : undefined}
            aria-invalid={Boolean(fieldErrors.notes)}
            className={`${inputClass} mt-2 min-h-20 resize-y py-3`}
            id={`${prefix}-notes`}
            maxLength={500}
            name="notes"
            placeholder="Optional reason or operator note"
            rows={2}
          />
          <FieldError id={notesErrorId} message={fieldErrors.notes} />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[#e5eeeb] pt-4">
          <SubmitButton pendingLabel="Recording...">Record movement</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </div>
  );
}

function InventoryTypeBadge({ itemType }: { itemType: InventoryItemDto["item_type"] }) {
  const shopProduct = itemType === "shop_product";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${shopProduct ? "bg-[#e9edff] text-[#5368a5]" : "bg-[#e6f5f1] text-[#0d8278]"}`}>
      {inventoryItemTypeLabels[itemType]}
    </span>
  );
}

function buildInventoryHref(filters: InventoryFilters, changes: Partial<InventoryFilters> = {}) {
  const nextFilters = { ...filters, ...changes };
  const params = new URLSearchParams();

  if (nextFilters.search) params.set("search", nextFilters.search);
  if (nextFilters.itemType !== "all") params.set("type", nextFilters.itemType);
  if (nextFilters.status !== "all") params.set("status", nextFilters.status);
  if (nextFilters.page > 1) params.set("page", String(nextFilters.page));
  if (nextFilters.movementItemId) params.set("movementItem", nextFilters.movementItemId);
  if (nextFilters.movementType) params.set("movementType", nextFilters.movementType);
  if (nextFilters.movementFrom) params.set("movementFrom", nextFilters.movementFrom);
  if (nextFilters.movementTo) params.set("movementTo", nextFilters.movementTo);
  if (nextFilters.movementPage > 1) params.set("movementPage", String(nextFilters.movementPage));

  const query = params.toString();
  return query ? `/admin/inventory?${query}` : "/admin/inventory";
}

function MovementFilterHiddenFields({ filters }: { filters: InventoryFilters }) {
  return (
    <>
      <input name="movementItem" type="hidden" value={filters.movementItemId} />
      <input name="movementType" type="hidden" value={filters.movementType} />
      <input name="movementFrom" type="hidden" value={filters.movementFrom} />
      <input name="movementTo" type="hidden" value={filters.movementTo} />
      <input name="movementPage" type="hidden" value={filters.movementPage} />
    </>
  );
}

function ItemFilterControls({ filters }: { filters: InventoryFilters }) {
  return (
    <form action="/admin/inventory" className="mt-5 rounded-2xl border border-[#dce8e4] bg-white p-4" method="get">
      <MovementFilterHiddenFields filters={filters} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(150px,0.7fr)_minmax(150px,0.7fr)_auto] lg:items-end">
        <div>
          <label className={labelClass} htmlFor="inventory-search">Search by item name</label>
          <input className={`${inputClass} mt-2`} defaultValue={filters.search} id="inventory-search" maxLength={80} name="search" placeholder="Search inventory" type="search" />
        </div>
        <div>
          <label className={labelClass} htmlFor="inventory-type-filter">Type</label>
          <select className={`${inputClass} mt-2`} defaultValue={filters.itemType === "all" ? "" : filters.itemType} id="inventory-type-filter" name="type">
            <option value="">All types</option>
            <option value="consumable">Consumables</option>
            <option value="shop_product">Shop products</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="inventory-status-filter">Status</label>
          <select className={`${inputClass} mt-2`} defaultValue={filters.status === "all" ? "" : filters.status} id="inventory-status-filter" name="status">
            <option value="">All statuses</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </div>
        <button className="min-h-11 rounded-xl bg-[#102c38] px-5 text-sm font-bold text-white transition-colors hover:bg-[#183d4b]" type="submit">Apply filters</button>
      </div>
      {(filters.search || filters.itemType !== "all" || filters.status !== "all") && (
        <Link className="mt-3 inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-[#0d8278] hover:bg-[#edf8f5]" href={buildInventoryHref(filters, { search: "", itemType: "all", status: "all", page: 1 })}>
          Clear item filters
        </Link>
      )}
    </form>
  );
}

function PaginationControls({
  filters,
  pagination,
  kind,
}: {
  filters: InventoryFilters;
  pagination: InventoryPagination;
  kind: "items" | "movements";
}) {
  if (pagination.totalItems === 0) {
    return null;
  }

  const isMovement = kind === "movements";
  const currentPage = pagination.page;
  const pageChange = (page: number) => isMovement
    ? buildInventoryHref(filters, { movementPage: page })
    : buildInventoryHref(filters, { page });
  const firstShown = (currentPage - 1) * pagination.pageSize + 1;
  const lastShown = Math.min(currentPage * pagination.pageSize, pagination.totalItems);
  const previousHref = currentPage > 1 ? pageChange(currentPage - 1) : undefined;
  const nextHref = currentPage < pagination.totalPages ? pageChange(currentPage + 1) : undefined;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#dce8e4] bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[#607378]">Showing <span className="font-bold text-[#18323c]">{firstShown}-{lastShown}</span> of <span className="font-bold text-[#18323c]">{pagination.totalItems}</span></p>
      <div className="flex items-center gap-2">
        {previousHref ? <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d7e5e0] px-3 text-xs font-bold text-[#486168] hover:border-[#9acdc3] hover:text-[#0d8278]" href={previousHref}>Previous</Link> : <span className="inline-flex min-h-10 items-center rounded-lg border border-[#edf2f0] px-3 text-xs font-bold text-[#b0bbba]">Previous</span>}
        <span className="px-2 text-xs font-bold text-[#607378]">Page {currentPage} of {pagination.totalPages}</span>
        {nextHref ? <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d7e5e0] px-3 text-xs font-bold text-[#486168] hover:border-[#9acdc3] hover:text-[#0d8278]" href={nextHref}>Next</Link> : <span className="inline-flex min-h-10 items-center rounded-lg border border-[#edf2f0] px-3 text-xs font-bold text-[#b0bbba]">Next</span>}
      </div>
    </div>
  );
}

function InventoryTable({ items, filters, pagination }: { items: InventoryItemDto[]; filters: InventoryFilters; pagination: InventoryPagination }) {
  const hasFilters = Boolean(filters.search || filters.itemType !== "all" || filters.status !== "all");

  return (
    <>
      <ItemFilterControls filters={filters} />
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce8e4] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-[#f8fbfa]">
            <tr className="border-b border-[#e5eeeb] text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#708085]">
              <th className="px-5 py-4">Item name</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Unit</th>
              <th className="px-5 py-4 text-right">Current stock</th>
              <th className="px-5 py-4 text-right">Minimum stock</th>
              <th className="px-5 py-4 text-right">Selling price</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item) => (
              <tr className="border-b border-[#edf2f0] last:border-0" key={item.id}>
                <td className="px-5 py-4">
                  <p className="font-bold text-[#18323c]">{item.name}</p>
                  <p className="mt-1 text-xs text-[#899797]">Order {item.sort_order}</p>
                </td>
                <td className="px-5 py-4"><InventoryTypeBadge itemType={item.item_type} /></td>
                <td className="px-5 py-4 text-sm font-semibold text-[#486168]">{item.unit}</td>
                <td className="px-5 py-4 text-right text-sm font-bold text-[#18323c]">{formatQuantity(item.current_stock)}</td>
                <td className="px-5 py-4 text-right text-sm text-[#607378]">{formatQuantity(item.minimum_stock)}</td>
                <td className="px-5 py-4 text-right text-sm text-[#607378]">{formatPrice(item.selling_price)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <StockStatusBadge status={getStockStatus(item)} />
                    <ActiveBadge active={item.active} />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-5 py-10 text-center text-sm leading-6 text-[#6b7b7f]" colSpan={7}>
                  {hasFilters ? "No inventory items found." : "No inventory items yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls filters={filters} kind="items" pagination={pagination} />
    </>
  );
}

function movementQuantityLabel(movement: InventoryMovementDto, unit: string) {
  const deductsStock = movement.movement_type === "adjustment_out"
    || movement.movement_type === "service_usage"
    || movement.movement_type === "product_sale";

  return `${deductsStock ? "-" : "+"}${formatQuantity(movement.quantity)} ${unit}`;
}

function movementTypeClass(movementType: InventoryMovementDto["movement_type"]) {
  return movementType === "service_usage" || movementType === "product_sale"
    ? "bg-[#e9edff] text-[#5368a5]"
    : "bg-[#e6f5f1] text-[#0d8278]";
}

function MovementHistory({
  itemOptions,
  movements,
  filters,
  pagination,
}: {
  itemOptions: InventoryItemOptionDto[];
  movements: InventoryMovementDto[];
  filters: InventoryFilters;
  pagination: InventoryPagination;
}) {
  const itemById = new Map(itemOptions.map((item) => [item.id, item]));
  const hasFilters = Boolean(filters.movementItemId || filters.movementType || filters.movementFrom || filters.movementTo);

  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="movement-history">
      <SectionHeading
        count={pagination.totalItems}
        description="Every stock change records the before and after balance. Transaction usage is shown alongside manual stock movements, newest first."
        index="03"
        title="Movement history"
      />
      <form action="/admin/inventory" className="mt-5 rounded-2xl border border-[#dce8e4] bg-white p-4" method="get">
        <input name="search" type="hidden" value={filters.search} />
        <input name="type" type="hidden" value={filters.itemType === "all" ? "" : filters.itemType} />
        <input name="status" type="hidden" value={filters.status === "all" ? "" : filters.status} />
        <input name="page" type="hidden" value={filters.page} />
        <div className="grid gap-3 xl:grid-cols-[minmax(180px,1.1fr)_minmax(180px,1fr)_minmax(150px,0.7fr)_minmax(150px,0.7fr)_auto] xl:items-end">
          <div>
            <label className={labelClass} htmlFor="movement-item-filter">Inventory item</label>
            <select className={`${inputClass} mt-2`} defaultValue={filters.movementItemId} id="movement-item-filter" name="movementItem">
              <option value="">All inventory items</option>
              {itemOptions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active ? "" : " (inactive)"}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="movement-type-filter">Movement type</label>
            <select className={`${inputClass} mt-2`} defaultValue={filters.movementType} id="movement-type-filter" name="movementType">
              <option value="">All movement types</option>
              {inventoryMovementTypes.map((movementType) => <option key={movementType} value={movementType}>{inventoryMovementTypeLabels[movementType]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="movement-from-filter">From date (PHT)</label>
            <input className={`${inputClass} mt-2`} defaultValue={filters.movementFrom} id="movement-from-filter" name="movementFrom" type="date" />
          </div>
          <div>
            <label className={labelClass} htmlFor="movement-to-filter">To date (PHT)</label>
            <input className={`${inputClass} mt-2`} defaultValue={filters.movementTo} id="movement-to-filter" name="movementTo" type="date" />
          </div>
          <button className="min-h-11 rounded-xl bg-[#102c38] px-5 text-sm font-bold text-white transition-colors hover:bg-[#183d4b]" type="submit">Apply filters</button>
        </div>
        {hasFilters && (
          <Link className="mt-3 inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-[#0d8278] hover:bg-[#edf8f5]" href={buildInventoryHref(filters, { movementItemId: "", movementType: "", movementFrom: "", movementTo: "", movementPage: 1 })}>
            Clear movement filters
          </Link>
        )}
      </form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce8e4] bg-white">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-[#f8fbfa]">
            <tr className="border-b border-[#e5eeeb] text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#708085]">
              <th className="px-5 py-4">Date / time</th>
              <th className="px-5 py-4">Item</th>
              <th className="px-5 py-4">Movement type</th>
              <th className="px-5 py-4 text-right">Quantity</th>
              <th className="px-5 py-4 text-right">Stock before</th>
              <th className="px-5 py-4 text-right">Stock after</th>
              <th className="px-5 py-4">Reference</th>
              <th className="px-5 py-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {movements.length > 0 ? movements.map((movement) => {
              const item = itemById.get(movement.inventory_item_id);

              return (
                <tr className="border-b border-[#edf2f0] align-top last:border-0" key={movement.id}>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#607378]">{formatDateTime(movement.created_at)}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-[#18323c]">{item?.name ?? "Unknown item"}</p>
                    {item && <p className="mt-1 text-xs text-[#899797]">{item.unit}{item.active ? "" : " · inactive"}</p>}
                  </td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${movementTypeClass(movement.movement_type)}`}>{inventoryMovementTypeLabels[movement.movement_type]}</span></td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-[#18323c]">{movementQuantityLabel(movement, item?.unit ?? "units")}</td>
                  <td className="px-5 py-4 text-right text-sm text-[#607378]">{formatQuantity(movement.stock_before)}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-[#18323c]">{formatQuantity(movement.stock_after)}</td>
                  <td className="max-w-[220px] px-5 py-4 text-sm leading-5 text-[#486168]">{movement.reference_label ?? "Manual admin entry"}</td>
                  <td className="max-w-[280px] px-5 py-4 text-sm leading-5 text-[#607378]">{movement.notes || "No notes"}</td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-5 py-10 text-center text-sm leading-6 text-[#6b7b7f]" colSpan={8}>
                  {hasFilters ? "No inventory movements found." : "No inventory movements yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls filters={filters} kind="movements" pagination={pagination} />
    </section>
  );
}

function InventoryItemPanel({ item }: { item: InventoryItemDto }) {
  return (
    <article className="grid gap-4 lg:grid-cols-2">
      <InventoryItemEditor item={item} />
      <StockMovementForm item={item} />
    </article>
  );
}

export function InventoryManager({
  items,
  movements,
  itemOptions,
  summary,
  itemPagination,
  movementPagination,
  filters,
}: InventoryManagerProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Inventory control</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e] sm:text-4xl">Keep every item accounted for.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#64757a]">
            Track internal consumables and optional shop products in their canonical base units. Stock changes are recorded in a protected ledger.
          </p>
        </div>
        <Link className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cbdcd8] bg-white px-4 text-sm font-bold text-[#28424d] transition-colors hover:border-[#9acdc3] hover:bg-[#f8fbfa]" href="/admin/catalog#service-requirements">
          Configure service recipes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ccebe3] bg-[#e9f8f4] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#0d8278]">Total active inventory items</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{summary.totalActiveItems}</p>
          <p className="mt-1 text-xs text-[#52706e]">Current database count</p>
        </div>
        <div className="rounded-2xl border border-[#f1dfbd] bg-[#fff7e7] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#ac7121]">Low stock</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{summary.lowStockItems}</p>
          <p className="mt-1 text-xs text-[#8d754f]">Above zero, at or below minimum</p>
        </div>
        <div className="rounded-2xl border border-[#f0d3c8] bg-[#fff4ef] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#b34646]">Out of stock</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{summary.outOfStockItems}</p>
          <p className="mt-1 text-xs text-[#9a6259]">Current stock at or below zero</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-[#102c38] p-6 text-white shadow-[0_18px_45px_rgba(16,44,56,0.12)] sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9cefe2]">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#8fe7da]">Inventory rules</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">Stock is ledger-first.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">New items start at zero. Use Stock In or an adjustment to change the balance; direct stock overwrites are not available.</p>
            </div>
          </div>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-sm font-bold text-[#c6fff6]">
            <Sparkles className="h-4 w-4" />
            Admin-only inventory
          </span>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="inventory-table">
        <SectionHeading
          count={itemPagination.totalItems}
          description="Monitor current balances, minimum thresholds, item types, optional PHP selling prices, and stock status."
          index="01"
          title="Inventory items"
        />
        <InventoryTable filters={filters} items={items} pagination={itemPagination} />
      </section>

      <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="inventory-management">
        <SectionHeading
          count={itemPagination.totalItems}
          description="Edit item details and use the movement form beside each item to update stock atomically. Current stock is never overwritten directly."
          index="02"
          title="Manage inventory"
        />
        <div className="mt-5">
          <InventoryItemEditor />
        </div>
        <div className="mt-4 space-y-4">
          {items.length > 0 ? items.map((item) => <InventoryItemPanel item={item} key={item.id} />) : (
            <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-6 text-sm leading-6 text-[#6b7b7f]">
              {filters.search || filters.itemType !== "all" || filters.status !== "all" ? "No inventory items found." : "Add an item above to unlock its edit and stock movement controls."}
            </div>
          )}
        </div>
      </section>

      <MovementHistory filters={filters} itemOptions={itemOptions} movements={movements} pagination={movementPagination} />

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196]">
        <CheckCircle className="h-4 w-4 text-[#0d9f91]" />
        Inventory and movement history are protected by the active-admin policy.
      </p>
    </div>
  );
}
