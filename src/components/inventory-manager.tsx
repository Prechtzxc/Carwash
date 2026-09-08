"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
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
import type { InventoryData, InventoryItemDto, InventoryMovementDto } from "@/lib/inventory/data";
import {
  inventoryItemTypeLabels,
  inventoryItemTypes,
  inventoryMovementTypeLabels,
  inventoryMovementTypes,
  inventoryUnits,
  inventoryUnitLabels,
  manualInventoryMovementTypes,
  type InventoryMovementType,
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
  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

function getStockStatus(item: InventoryItemDto): StockStatus {
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

const stockStatusLabels: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

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
              aria-describedby={state.fieldErrors?.name ? nameErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.name ?? ""}
              id={`${prefix}-name`}
              maxLength={120}
              name="name"
              placeholder="e.g. Car Shampoo"
              required
            />
            <FieldError id={nameErrorId} message={state.fieldErrors?.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-sort-order`}>Sort order</label>
            <input
              aria-describedby={state.fieldErrors?.sortOrder ? sortOrderErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.sortOrder)}
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
            <FieldError id={sortOrderErrorId} message={state.fieldErrors?.sortOrder} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-item-type`}>Item type</label>
            <select
              aria-describedby={state.fieldErrors?.itemType ? typeErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.itemType)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.item_type ?? "consumable"}
              id={`${prefix}-item-type`}
              name="itemType"
            >
              {inventoryItemTypes.map((itemType) => (
                <option key={itemType} value={itemType}>{inventoryItemTypeLabels[itemType]}</option>
              ))}
            </select>
            <FieldError id={typeErrorId} message={state.fieldErrors?.itemType} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-unit`}>Base unit</label>
            <select
              aria-describedby={state.fieldErrors?.unit ? unitErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.unit)}
              className={`${inputClass} mt-2`}
              defaultValue={item?.unit ?? "ml"}
              id={`${prefix}-unit`}
              name="unit"
            >
              {inventoryUnits.map((unit) => (
                <option key={unit} value={unit}>{inventoryUnitLabels[unit]}</option>
              ))}
            </select>
            <FieldError id={unitErrorId} message={state.fieldErrors?.unit} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-minimum-stock`}>Minimum stock</label>
            <input
              aria-describedby={state.fieldErrors?.minimumStock ? minimumStockErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.minimumStock)}
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
            <FieldError id={minimumStockErrorId} message={state.fieldErrors?.minimumStock} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-selling-price`}>Selling price (PHP)</label>
            <input
              aria-describedby={state.fieldErrors?.sellingPrice ? sellingPriceErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.sellingPrice)}
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
            <FieldError id={sellingPriceErrorId} message={state.fieldErrors?.sellingPrice} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor={`${prefix}-description`}>Description</label>
          <textarea
            aria-describedby={state.fieldErrors?.description ? descriptionErrorId : undefined}
            aria-invalid={Boolean(state.fieldErrors?.description)}
            className={`${inputClass} mt-2 min-h-24 resize-y py-3`}
            defaultValue={item?.description ?? ""}
            id={`${prefix}-description`}
            maxLength={500}
            name="description"
            placeholder="Optional operator-facing description"
            rows={3}
          />
          <FieldError id={descriptionErrorId} message={state.fieldErrors?.description} />
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
              aria-describedby={state.fieldErrors?.quantity ? quantityErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors?.quantity)}
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
            <FieldError id={quantityErrorId} message={state.fieldErrors?.quantity} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}-notes`}>Notes</label>
          <textarea
            aria-describedby={state.fieldErrors?.notes ? notesErrorId : undefined}
            aria-invalid={Boolean(state.fieldErrors?.notes)}
            className={`${inputClass} mt-2 min-h-20 resize-y py-3`}
            id={`${prefix}-notes`}
            maxLength={500}
            name="notes"
            placeholder="Optional reason or supplier note"
            rows={2}
          />
          <FieldError id={notesErrorId} message={state.fieldErrors?.notes} />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[#e5eeeb] pt-4">
          <SubmitButton pendingLabel="Recording...">Record movement</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </div>
  );
}

function InventoryTable({ items }: { items: InventoryItemDto[] }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce8e4] bg-white">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead className="bg-[#f8fbfa]">
          <tr className="border-b border-[#e5eeeb] text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#708085]">
            <th className="px-5 py-4">Item name</th>
            <th className="px-5 py-4">Type</th>
            <th className="px-5 py-4">Unit</th>
            <th className="px-5 py-4 text-right">Current</th>
            <th className="px-5 py-4 text-right">Minimum</th>
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
              <td className="px-5 py-4 text-sm text-[#486168]">{inventoryItemTypeLabels[item.item_type]}</td>
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
                No inventory items yet. Add the first item below; no stock is created until a movement is recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MovementHistory({ items, movements }: { items: InventoryItemDto[]; movements: InventoryMovementDto[] }) {
  const [itemFilter, setItemFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<InventoryMovementType | "">("");
  const filteredMovements = movements.filter((movement) => {
    if (itemFilter && movement.inventory_item_id !== itemFilter) {
      return false;
    }

    if (movementTypeFilter && movement.movement_type !== movementTypeFilter) {
      return false;
    }

    return true;
  });

  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="movement-history">
      <SectionHeading
        count={filteredMovements.length}
        description="Every manual stock change records the before and after balance. Newest movements appear first."
        index="03"
        title="Movement history"
      />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelClass} htmlFor="movement-item-filter">Filter by item</label>
          <select className={`${inputClass} mt-2`} id="movement-item-filter" onChange={(event) => setItemFilter(event.target.value)} value={itemFilter}>
            <option value="">All inventory items</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className={labelClass} htmlFor="movement-type-filter">Filter by movement</label>
          <select className={`${inputClass} mt-2`} id="movement-type-filter" onChange={(event) => setMovementTypeFilter(event.target.value as InventoryMovementType | "")} value={movementTypeFilter}>
            <option value="">All movement types</option>
            {inventoryMovementTypes.map((movementType) => (
              <option key={movementType} value={movementType}>{inventoryMovementTypeLabels[movementType]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce8e4] bg-white">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead className="bg-[#f8fbfa]">
            <tr className="border-b border-[#e5eeeb] text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#708085]">
              <th className="px-5 py-4">Date / time</th>
              <th className="px-5 py-4">Item</th>
              <th className="px-5 py-4">Movement</th>
              <th className="px-5 py-4 text-right">Quantity</th>
              <th className="px-5 py-4 text-right">Before</th>
              <th className="px-5 py-4 text-right">After</th>
              <th className="px-5 py-4">Notes / reference</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length > 0 ? filteredMovements.map((movement) => {
              const item = items.find((candidate) => candidate.id === movement.inventory_item_id);

              return (
                <tr className="border-b border-[#edf2f0] last:border-0" key={movement.id}>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#607378]">{formatDateTime(movement.created_at)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#18323c]">{item?.name ?? "Unknown item"}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#486168]">{inventoryMovementTypeLabels[movement.movement_type]}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-[#18323c]">{formatQuantity(movement.quantity)} {item?.unit ?? ""}</td>
                  <td className="px-5 py-4 text-right text-sm text-[#607378]">{formatQuantity(movement.stock_before)}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-[#18323c]">{formatQuantity(movement.stock_after)}</td>
                  <td className="max-w-[260px] px-5 py-4 text-sm leading-5 text-[#607378]">
                    <p>{movement.notes || "No notes"}</p>
                    {movement.reference_type && <p className="mt-1 text-xs text-[#899797]">{movement.reference_type}{movement.reference_id ? ` · ${movement.reference_id}` : ""}</p>}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-5 py-10 text-center text-sm leading-6 text-[#6b7b7f]" colSpan={7}>
                  No movements match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

export function InventoryManager({ items, movements }: InventoryManagerProps) {
  const activeItems = items.filter((item) => item.active);
  const lowStockItems = activeItems.filter((item) => getStockStatus(item) === "low_stock");
  const outOfStockItems = activeItems.filter((item) => getStockStatus(item) === "out_of_stock");

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
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#0d8278]">Active items</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{activeItems.length}</p>
          <p className="mt-1 text-xs text-[#52706e]">of {items.length} configured</p>
        </div>
        <div className="rounded-2xl border border-[#f1dfbd] bg-[#fff7e7] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#ac7121]">Low stock</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{lowStockItems.length}</p>
          <p className="mt-1 text-xs text-[#8d754f]">Above zero, at or below minimum</p>
        </div>
        <div className="rounded-2xl border border-[#f0d3c8] bg-[#fff4ef] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#b34646]">Out of stock</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{outOfStockItems.length}</p>
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
          count={items.length}
          description="Monitor current balances, minimum thresholds, item types, and optional PHP selling prices."
          index="01"
          title="Inventory items"
        />
        <InventoryTable items={items} />
      </section>

      <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="inventory-management">
        <SectionHeading
          count={items.length}
          description="Edit item details and use the movement form beside each item to update stock atomically."
          index="02"
          title="Manage inventory"
        />
        <div className="mt-5">
          <InventoryItemEditor />
        </div>
        <div className="mt-4 space-y-4">
          {items.length > 0 ? items.map((item) => <InventoryItemPanel item={item} key={item.id} />) : (
            <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-6 text-sm leading-6 text-[#6b7b7f]">
              Add an item above to unlock its edit and stock movement controls.
            </div>
          )}
        </div>
      </section>

      <MovementHistory items={items} movements={movements} />

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196]">
        <CheckCircle className="h-4 w-4 text-[#0d9f91]" />
        Inventory and movement history are protected by the active-admin policy.
      </p>
    </div>
  );
}
