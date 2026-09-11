"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  ArrowRight,
  CarFront,
  CheckCircle,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock,
  Sparkles,
  Users,
} from "@/components/icons";
import {
  cancelTransactionAction,
  completeConfirmedTransactionAction,
  confirmPendingTransactionAction,
  replaceTransactionStaffAction,
  revisePendingTransactionAction,
  type TransactionActionState,
} from "@/app/admin/(protected)/transactions/actions";
import { initialFormActionState } from "@/lib/form-action-state";
import type {
  AdminTransaction,
  AdminTransactionCatalog,
  AdminTransactionReviewPageData,
  TransactionStatus,
} from "@/lib/transactions/data";

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#dedbd1] bg-white px-3.5 text-sm text-[#292929] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8] disabled:cursor-not-allowed disabled:bg-[#f7f6f1] disabled:text-[#89867d]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#65635d]";

type ProductDraft = {
  inventoryItemId: string;
  quantity: number;
};

const statusStyles: Record<TransactionStatus, { badge: string; dot: string; title: string }> = {
  pending: { badge: "bg-[#fff7cc] text-[#756000]", dot: "bg-[#d4a900]", title: "Awaiting review" },
  confirmed: { badge: "bg-[#f5edb6] text-[#756000]", dot: "bg-[#b58b00]", title: "Confirmed" },
  completed: { badge: "bg-[#f1f0eb] text-[#3f3f3f]", dot: "bg-[#171717]", title: "Completed" },
  cancelled: { badge: "bg-[#fff0ed] text-[#b34646]", dot: "bg-[#d4665f]", title: "Cancelled" },
};

function formatCurrency(value: number) {
  return `PHP ${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles = statusStyles[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${styles.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {styles.title}
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-semibold text-[#b34646]" id={id}>{message}</p>;
}

function ActionFeedback({ state }: { state: TransactionActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <div aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${state.status === "success" ? "border-[#ead98a] bg-[#fff7cc] text-[#756000]" : "border-[#f0d3c8] bg-[#fff4ef] text-[#9f4c47]"}`}>
      {state.message}
    </div>
  );
}

function FormButton({ children, pendingLabel, tone = "primary" }: { children: ReactNode; pendingLabel: string; tone?: "primary" | "danger" | "quiet" }) {
  const { pending } = useFormStatus();
  const className = tone === "danger"
    ? "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b34646] px-4 text-sm font-bold text-white transition-colors hover:bg-[#963d3d] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
    : tone === "quiet"
      ? "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d7d4ca] bg-white px-4 text-sm font-bold text-[#4a4945] transition-colors hover:border-[#d4b900] hover:text-[#a77f00] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
    : "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-4 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto";

  return <button className={className} disabled={pending} type="submit">{pending ? pendingLabel : children}</button>;
}

function SectionHeading({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]">{icon}</span>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#65635d]">{description}</p>
      </div>
    </div>
  );
}

function customerDisplayName(transaction: AdminTransaction) {
  return `${transaction.customer.first_name} ${transaction.customer.last_name}`.trim();
}

function vehicleDisplayName(transaction: AdminTransaction) {
  return [transaction.vehicle.make, transaction.vehicle.model, transaction.vehicle.categoryName].filter(Boolean).join(" / ");
}

function getServicePrice(catalog: AdminTransactionCatalog, serviceId: string, sizeClass: AdminTransaction["vehicle"]["sizeClass"]) {
  return catalog.servicePrices.find((price) => price.service_id === serviceId && price.size_class === sizeClass)?.price ?? null;
}

function getProductName(catalog: AdminTransactionCatalog, transaction: AdminTransaction, inventoryItemId: string) {
  return catalog.products.find((product) => product.id === inventoryItemId)?.name
    ?? transaction.products.find((product) => product.inventoryItemId === inventoryItemId)?.name
    ?? "Unavailable product";
}

function SummaryLines({ transaction }: { transaction: AdminTransaction }) {
  return (
    <div className="space-y-3">
      {transaction.services.map((service) => (
        <div className="flex items-start justify-between gap-4 text-sm" key={service.id}>
          <div className="min-w-0">
            <p className="break-words font-semibold text-[#3f3f3f]">{service.name}</p>
            <p className="mt-0.5 text-xs text-[#89867d]">{service.sizeClass} · qty {service.quantity}</p>
          </div>
          <p className="shrink-0 font-bold text-[#292929]">{formatCurrency(service.lineTotal)}</p>
        </div>
      ))}
      {transaction.products.map((product) => (
        <div className="flex items-start justify-between gap-4 text-sm" key={product.id}>
          <div className="min-w-0">
            <p className="break-words font-semibold text-[#3f3f3f]">{product.name}</p>
            <p className="mt-0.5 text-xs text-[#89867d]">Shop product · qty {product.quantity}</p>
          </div>
          <p className="shrink-0 font-bold text-[#292929]">{formatCurrency(product.lineTotal)}</p>
        </div>
      ))}
      {transaction.services.length === 0 && transaction.products.length === 0 && <p className="text-sm text-[#89867d]">No line items recorded.</p>}
    </div>
  );
}

function ReadOnlyDetails({ transaction }: { transaction: AdminTransaction }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#dfddd4] bg-white p-4 sm:p-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Customer</p>
        <p className="mt-3 text-lg font-bold text-[#292929]">{customerDisplayName(transaction)}</p>
        <dl className="mt-4 space-y-2 text-sm text-[#65635d]">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><dt>Mobile</dt><dd className="break-words font-semibold text-[#3f3f3f] sm:text-right">{transaction.customer.mobile_number}</dd></div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><dt>Email</dt><dd className="min-w-0 break-words font-semibold text-[#3f3f3f] sm:max-w-[65%] sm:text-right">{transaction.customer.email ?? "Not provided"}</dd></div>
        </dl>
      </div>
      <div className="rounded-2xl border border-[#dfddd4] bg-white p-4 sm:p-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Vehicle</p>
        <p className="mt-3 text-lg font-bold text-[#292929]">{vehicleDisplayName(transaction)}</p>
        <dl className="mt-4 space-y-2 text-sm text-[#65635d]">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><dt>Plate</dt><dd className="break-words font-semibold text-[#3f3f3f] sm:text-right">{transaction.vehicle.plate_number ?? "Not provided"}</dd></div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><dt>Color</dt><dd className="break-words font-semibold text-[#3f3f3f] sm:text-right">{transaction.vehicle.color ?? "Not provided"}</dd></div>
        </dl>
      </div>
    </div>
  );
}

function TransactionEditForm({ data }: { data: AdminTransactionReviewPageData }) {
  const { catalog, transaction } = data;
  const router = useRouter();
  const [state, formAction] = useActionState(revisePendingTransactionAction, initialFormActionState);
  const [firstName, setFirstName] = useState(transaction.customer.first_name);
  const [lastName, setLastName] = useState(transaction.customer.last_name);
  const [mobileNumber, setMobileNumber] = useState(transaction.customer.mobile_number);
  const [email, setEmail] = useState(transaction.customer.email ?? "");
  const [vehicleCategoryId, setVehicleCategoryId] = useState(transaction.vehicle.vehicle_category_id);
  const [plateNumber, setPlateNumber] = useState(transaction.vehicle.plate_number ?? "");
  const [make, setMake] = useState(transaction.vehicle.make ?? "");
  const [model, setModel] = useState(transaction.vehicle.model ?? "");
  const [color, setColor] = useState(transaction.vehicle.color ?? "");
  const [serviceIds, setServiceIds] = useState(() => transaction.services.map((service) => service.serviceId));
  const [productLines, setProductLines] = useState<ProductDraft[]>(() => transaction.products.map((product) => ({ inventoryItemId: product.inventoryItemId, quantity: product.quantity })));

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  const selectedCategory = catalog.categories.find((category) => category.id === vehicleCategoryId);
  const sizeClass = selectedCategory?.size_class ?? transaction.vehicle.sizeClass;
  const selectedServiceTotal = serviceIds.reduce((total, serviceId) => total + (getServicePrice(catalog, serviceId, sizeClass) ?? 0), 0);
  const selectedProductTotal = productLines.reduce((total, line) => {
    const product = catalog.products.find((candidate) => candidate.id === line.inventoryItemId);
    return total + (product?.selling_price ?? 0) * line.quantity;
  }, 0);
  const availableProducts = catalog.products.filter((product) => !productLines.some((line) => line.inventoryItemId === product.id));
  const selectedCategoryIsUnavailable = !selectedCategory;

  function toggleService(serviceId: string) {
    setServiceIds((current) => current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
  }

  function addProduct(inventoryItemId: string) {
    if (!inventoryItemId) {
      return;
    }

    setProductLines((current) => [...current, { inventoryItemId, quantity: 1 }]);
  }

  function updateProduct(index: number, update: Partial<ProductDraft>) {
    setProductLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...update } : line));
  }

  function removeProduct(index: number) {
    setProductLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  return (
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
      <SectionHeading
        description="Pending requests can be corrected before confirmation. Prices are recalculated from the active catalog when you save."
        eyebrow="Editable while pending"
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Review and revise details"
      />

      <form action={formAction} className="mt-5 space-y-5 sm:space-y-6">
        <input name="transactionId" type="hidden" value={transaction.id} />
        <input name="serviceIds" type="hidden" value={JSON.stringify(serviceIds)} readOnly />
        <input name="productLines" type="hidden" value={JSON.stringify(productLines)} readOnly />

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#65635d]">Customer details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="transaction-first-name">First name</label>
              <input aria-describedby={state.fieldErrors.firstName ? "transaction-first-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors.firstName)} className={inputClass} id="transaction-first-name" name="firstName" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
              <FieldError id="transaction-first-name-error" message={state.fieldErrors.firstName} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-last-name">Last name</label>
              <input aria-describedby={state.fieldErrors.lastName ? "transaction-last-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors.lastName)} className={inputClass} id="transaction-last-name" name="lastName" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
              <FieldError id="transaction-last-name-error" message={state.fieldErrors.lastName} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-mobile">Mobile number</label>
              <input aria-describedby={state.fieldErrors.mobileNumber ? "transaction-mobile-error" : undefined} aria-invalid={Boolean(state.fieldErrors.mobileNumber)} className={inputClass} id="transaction-mobile" inputMode="tel" name="mobileNumber" onChange={(event) => setMobileNumber(event.target.value)} required value={mobileNumber} />
              <FieldError id="transaction-mobile-error" message={state.fieldErrors.mobileNumber} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-email">Email <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
              <input aria-describedby={state.fieldErrors.email ? "transaction-email-error" : undefined} aria-invalid={Boolean(state.fieldErrors.email)} className={inputClass} id="transaction-email" name="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
              <FieldError id="transaction-email-error" message={state.fieldErrors.email} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#65635d]">Vehicle details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="transaction-category">Vehicle category</label>
              <select aria-describedby={state.fieldErrors.vehicleCategoryId ? "transaction-category-error" : undefined} aria-invalid={Boolean(state.fieldErrors.vehicleCategoryId)} className={inputClass} id="transaction-category" name="vehicleCategoryId" onChange={(event) => setVehicleCategoryId(event.target.value)} value={vehicleCategoryId}>
                {!selectedCategory && <option value={transaction.vehicle.vehicle_category_id}>{transaction.vehicle.categoryName} (currently unavailable)</option>}
                {catalog.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {selectedCategoryIsUnavailable && <p className="mt-1.5 text-xs font-semibold text-[#756000]">Choose an active category before saving.</p>}
              <FieldError id="transaction-category-error" message={state.fieldErrors.vehicleCategoryId} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-plate">Plate number <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
              <input aria-describedby={state.fieldErrors.plateNumber ? "transaction-plate-error" : undefined} aria-invalid={Boolean(state.fieldErrors.plateNumber)} className={inputClass} id="transaction-plate" name="plateNumber" onChange={(event) => setPlateNumber(event.target.value)} value={plateNumber} />
              <FieldError id="transaction-plate-error" message={state.fieldErrors.plateNumber} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-color">Color <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
              <input aria-describedby={state.fieldErrors.color ? "transaction-color-error" : undefined} aria-invalid={Boolean(state.fieldErrors.color)} className={inputClass} id="transaction-color" name="color" onChange={(event) => setColor(event.target.value)} value={color} />
              <FieldError id="transaction-color-error" message={state.fieldErrors.color} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-make">Make <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
              <input aria-describedby={state.fieldErrors.make ? "transaction-make-error" : undefined} aria-invalid={Boolean(state.fieldErrors.make)} className={inputClass} id="transaction-make" name="make" onChange={(event) => setMake(event.target.value)} value={make} />
              <FieldError id="transaction-make-error" message={state.fieldErrors.make} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-model">Model <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
              <input aria-describedby={state.fieldErrors.model ? "transaction-model-error" : undefined} aria-invalid={Boolean(state.fieldErrors.model)} className={inputClass} id="transaction-model" name="model" onChange={(event) => setModel(event.target.value)} value={model} />
              <FieldError id="transaction-model-error" message={state.fieldErrors.model} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#65635d]">Services</h3>
              <p className="mt-1 text-sm text-[#89867d]">Select the services to keep on this request.</p>
            </div>
            <p className="text-sm font-bold text-[#292929]">{formatCurrency(selectedServiceTotal)}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalog.services.map((service) => {
              const price = getServicePrice(catalog, service.id, sizeClass);
              const selected = serviceIds.includes(service.id);

              return (
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${selected ? "border-[#d4b900] bg-[#fff7cc]" : "border-[#dfddd4] bg-white hover:border-[#d4b900]"}`} key={service.id}>
                  <input aria-describedby={state.fieldErrors.serviceIds ? "transaction-services-error" : undefined} aria-invalid={Boolean(state.fieldErrors.serviceIds)} checked={selected} className="mt-1 h-4 w-4 accent-[#f4c400]" onChange={() => toggleService(service.id)} type="checkbox" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-bold text-[#3f3f3f]">{service.name}</span>
                      <span className="shrink-0 text-sm font-bold text-[#292929]">{price === null ? "Unavailable" : formatCurrency(price)}</span>
                    </span>
                    {service.description && <span className="mt-1 block text-xs leading-5 text-[#89867d]">{service.description}</span>}
                  </span>
                </label>
              );
            })}
            {transaction.services.filter((service) => !catalog.services.some((candidate) => candidate.id === service.serviceId)).map((service) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ead98a] bg-[#fff9d9] p-4" key={service.serviceId}>
                <input aria-describedby={state.fieldErrors.serviceIds ? "transaction-services-error" : undefined} aria-invalid={Boolean(state.fieldErrors.serviceIds)} checked={serviceIds.includes(service.serviceId)} className="mt-1 h-4 w-4 accent-[#f4c400]" onChange={() => toggleService(service.serviceId)} type="checkbox" />
                <span className="min-w-0 flex-1">
                  <span className="break-words text-sm font-bold text-[#756000]">{service.name} (currently unavailable)</span>
                  <span className="mt-1 block text-xs leading-5 text-[#756000]">Remove this service or replace it with an active service before saving.</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="transaction-services-error" message={state.fieldErrors.serviceIds} />
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#65635d]">Shop products</h3>
              <p className="mt-1 text-sm text-[#89867d]">Optional products use the active selling price at save time.</p>
            </div>
            <p className="text-sm font-bold text-[#292929]">{formatCurrency(selectedProductTotal)}</p>
          </div>
          <div className="mt-4 space-y-3">
            {productLines.map((line, index) => {
              const product = catalog.products.find((candidate) => candidate.id === line.inventoryItemId);
              const name = getProductName(catalog, transaction, line.inventoryItemId);

              return (
                <div className={`grid gap-3 rounded-xl border p-3 sm:p-4 sm:grid-cols-[minmax(0,1fr)_130px_auto] sm:items-end ${product ? "border-[#dfddd4] bg-white" : "border-[#ead98a] bg-[#fff9d9]"}`} key={`${line.inventoryItemId}-${index}`}>
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor={`transaction-product-${index}`}>Product</label>
                    <select aria-describedby={state.fieldErrors.productLines ? "transaction-products-error" : undefined} aria-invalid={Boolean(state.fieldErrors.productLines)} className={inputClass} id={`transaction-product-${index}`} onChange={(event) => updateProduct(index, { inventoryItemId: event.target.value })} value={line.inventoryItemId}>
                      {!product && <option value={line.inventoryItemId}>{name} (currently unavailable)</option>}
                      {catalog.products.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {formatCurrency(candidate.selling_price)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`transaction-product-quantity-${index}`}>Quantity</label>
                    <input aria-describedby={state.fieldErrors.productLines ? "transaction-products-error" : undefined} aria-invalid={Boolean(state.fieldErrors.productLines)} className={inputClass} id={`transaction-product-quantity-${index}`} inputMode="numeric" min="1" max="99" onChange={(event) => updateProduct(index, { quantity: Number(event.target.value) || 0 })} type="number" value={line.quantity || ""} />
                  </div>
              <button className="min-h-11 w-full rounded-xl border border-[#efd0c7] px-3 text-sm font-bold text-[#b34646] transition-colors hover:bg-[#fff4ef] sm:w-auto" onClick={() => removeProduct(index)} type="button">Remove</button>
                </div>
              );
            })}
            {availableProducts.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor="transaction-add-product">Add a shop product</label>
                <select className={`${inputClass} sm:max-w-md`} defaultValue="" id="transaction-add-product" onChange={(event) => { addProduct(event.target.value); event.currentTarget.value = ""; }}>
                  <option value="">Add a shop product...</option>
                  {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatCurrency(product.selling_price)}</option>)}
                </select>
              </div>
            )}
            {productLines.length === 0 && <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm text-[#89867d]">No shop products selected.</p>}
          </div>
          <FieldError id="transaction-products-error" message={state.fieldErrors.productLines} />
        </div>

        <div className="rounded-2xl border border-[#ead98a] bg-[#fff7cc] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#a77f00]">Recalculated estimate</p>
              <p className="mt-1 text-sm leading-6 text-[#6f652f]">The database will recalculate and snapshot the active prices atomically.</p>
            </div>
            <p className="text-2xl font-black tracking-[-0.04em] text-[#171717]">{formatCurrency(selectedServiceTotal + selectedProductTotal)}</p>
          </div>
        </div>

        <ActionFeedback state={state} />
        <div className="flex flex-col gap-3 border-t border-[#dfddd4] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-[#89867d]">Saving is only available while this request is pending. Confirmation and cancellation remain separate decisions.</p>
          <FormButton pendingLabel="Saving changes..."><ArrowRight className="h-4 w-4" />Save changes</FormButton>
        </div>
      </form>
    </section>
  );
}

type StaffAssignmentDraft = {
  staffId: string;
  sharePercent: number;
};

function serviceSalesTotal(transaction: AdminTransaction) {
  return transaction.services.reduce((total, service) => total + service.lineTotal, 0);
}

function StaffAssignmentReadOnly({ transaction }: { transaction: AdminTransaction }) {
  return (
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-6">
      <SectionHeading
        description="Final transaction assignments cannot be changed. Earnings use the service sales snapshot captured at completion."
        eyebrow="Read-only assignment"
        icon={<Users className="h-4 w-4" />}
        title="Assigned staff"
      />
      <div className="mt-5 space-y-3">
        {transaction.staffAssignments.length > 0 ? transaction.staffAssignments.map((assignment) => (
          <div className="flex flex-col gap-3 rounded-xl border border-[#dfddd4] bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={assignment.staffId}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-bold text-[#3f3f3f]">{assignment.name}</p>
                {!assignment.active && <span className="rounded-full bg-[#eef0eb] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#78766f]">Inactive</span>}
              </div>
              <p className="mt-1 text-xs text-[#89867d]">{assignment.sharePercent.toFixed(2)}% of service sales</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-black text-[#292929]">{assignment.earningsSnapshot === null ? "No snapshot" : formatCurrency(assignment.earningsSnapshot)}</p>
              <p className="mt-1 text-xs text-[#89867d]">{assignment.serviceSalesSnapshot === null ? "No completion snapshot" : `${formatCurrency(assignment.serviceSalesSnapshot)} service sales`}</p>
            </div>
          </div>
        )) : (
          <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">No staff assignments were recorded for this transaction.</p>
        )}
      </div>
    </section>
  );
}

function StaffAssignmentEditor({ data }: { data: AdminTransactionReviewPageData }) {
  const { staff, transaction } = data;
  const router = useRouter();
  const [state, formAction] = useActionState(replaceTransactionStaffAction, initialFormActionState);
  const [assignments, setAssignments] = useState<StaffAssignmentDraft[]>(() => transaction.staffAssignments.map((assignment) => ({
    staffId: assignment.staffId,
    sharePercent: assignment.sharePercent,
  })));
  const [newStaffId, setNewStaffId] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  const serviceSales = serviceSalesTotal(transaction);
  const totalShare = assignments.reduce((total, assignment) => total + (Number.isFinite(assignment.sharePercent) ? assignment.sharePercent : 0), 0);
  const roundedTotalShare = Math.round(totalShare * 100) / 100;
  const availableStaff = staff.filter((member) => member.active && !assignments.some((assignment) => assignment.staffId === member.id));
  const assignmentOptions = staff.filter((member) => member.active || assignments.some((assignment) => assignment.staffId === member.id));
  const shareIsComplete = Math.abs(roundedTotalShare - 40) < 0.001;
  const allocationMessage = assignments.length === 0
    ? "Assign staff before completing this service transaction."
    : roundedTotalShare > 40
      ? "Shares exceed the required 40%."
      : shareIsComplete
        ? "Ready for completion."
        : `${(40 - roundedTotalShare).toFixed(2)}% remains unassigned.`;

  function addAssignment() {
    if (!newStaffId) {
      return;
    }

    setAssignments((current) => [...current, { staffId: newStaffId, sharePercent: 40 }]);
    setNewStaffId("");
  }

  function updateAssignment(index: number, update: Partial<StaffAssignmentDraft>) {
    setAssignments((current) => current.map((assignment, assignmentIndex) => assignmentIndex === index ? { ...assignment, ...update } : assignment));
  }

  function removeAssignment(index: number) {
    setAssignments((current) => current.filter((_, assignmentIndex) => assignmentIndex !== index));
  }

  return (
    <section className="rounded-[1.5rem] border border-[#ead98a] bg-[#fff9d9] p-4 sm:p-6">
      <SectionHeading
        description="Assign one or more active staff members to this service transaction. Their shares must total exactly 40% before completion."
        eyebrow="Editable until completion"
        icon={<Users className="h-4 w-4" />}
        title="Staff assignment"
      />

      <form action={formAction} className="mt-5 space-y-4 sm:mt-6">
        <input name="transactionId" type="hidden" value={transaction.id} />
        <input name="assignments" type="hidden" value={JSON.stringify(assignments)} readOnly />

        <div className="rounded-xl border border-[#ead98a] bg-white p-4">
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#3f3f3f]">Service sales basis</p>
              <p className="mt-1 text-xs leading-5 text-[#89867d]">Only service line totals are used for staff earnings. Products remain company sales.</p>
            </div>
            <p className="text-lg font-black text-[#171717]">{formatCurrency(serviceSales)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {assignments.map((assignment, index) => {
            return (
              <div className="grid gap-3 rounded-xl border border-[#dfddd4] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end sm:p-4" key={assignment.staffId}>
                <div className="min-w-0">
                  <label className={labelClass} htmlFor={`transaction-staff-${index}`}>Staff member</label>
                  <select className={inputClass} id={`transaction-staff-${index}`} onChange={(event) => updateAssignment(index, { staffId: event.target.value })} value={assignment.staffId}>
                    {assignmentOptions.filter((member) => member.id === assignment.staffId || !assignments.some((candidate, candidateIndex) => candidateIndex !== index && candidate.staffId === member.id)).map((member) => <option key={member.id} value={member.id}>{member.name}{member.active ? "" : " (inactive)"}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor={`transaction-staff-share-${index}`}>Share %</label>
                  <input aria-describedby={state.fieldErrors.assignments ? "transaction-staff-assignments-error" : undefined} aria-invalid={Boolean(state.fieldErrors.assignments)} className={inputClass} id={`transaction-staff-share-${index}`} inputMode="decimal" max="40" min="0.01" onChange={(event) => updateAssignment(index, { sharePercent: Number(event.target.value) || 0 })} step="0.01" type="number" value={assignment.sharePercent || ""} />
                  <p className="mt-1.5 text-xs text-[#89867d]">Expected: {formatCurrency(serviceSales * assignment.sharePercent / 100)}</p>
                </div>
                <button className="min-h-11 w-full rounded-xl border border-[#efd0c7] px-3 text-sm font-bold text-[#b34646] transition-colors hover:bg-[#fff4ef] sm:w-auto" onClick={() => removeAssignment(index)} type="button">Remove</button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className={labelClass} htmlFor="transaction-add-staff">Add active staff member</label>
            <select className={inputClass} disabled={availableStaff.length === 0} id="transaction-add-staff" onChange={(event) => setNewStaffId(event.target.value)} value={newStaffId}>
              <option value="">{availableStaff.length === 0 ? "No additional active staff" : "Choose a staff member..."}</option>
              {availableStaff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
          <button className="min-h-11 w-full rounded-xl border border-[#d7d4ca] bg-white px-4 text-sm font-bold text-[#4a4945] transition-colors hover:border-[#c7a900] hover:text-[#a77f00] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto" disabled={!newStaffId} onClick={addAssignment} type="button">Add staff</button>
        </div>

        {staff.length === 0 && <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm leading-6 text-[#65635d]">No staff records exist yet. <Link className="font-bold text-[#a77f00] hover:text-[#756000]" href="/admin/sales/staff">Add staff records in Sales</Link> before assigning this transaction.</p>}
        {staff.length > 0 && availableStaff.length === 0 && assignments.length === 0 && <p className="rounded-xl border border-dashed border-[#cfcac0] bg-white p-4 text-sm leading-6 text-[#65635d]">No active staff members are available. Enable a staff record in <Link className="font-bold text-[#a77f00] hover:text-[#756000]" href="/admin/sales/staff">Sales staff management</Link>.</p>}

        <div className="rounded-xl border border-[#ead98a] bg-white p-4">
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#3f3f3f]">Current allocation: {roundedTotalShare.toFixed(2)}%</p>
              <p className={`mt-1 text-xs font-semibold ${shareIsComplete ? "text-[#756000]" : "text-[#9f4c47]"}`}>{allocationMessage}</p>
            </div>
            <p className="text-lg font-black text-[#171717]">{formatCurrency(serviceSales * roundedTotalShare / 100)}</p>
          </div>
        </div>

        <FieldError id="transaction-staff-assignments-error" message={state.fieldErrors.assignments} />
        <ActionFeedback state={state} />
        <div className="flex flex-col gap-3 border-t border-[#ead98a] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-[#6f652f]">The final service sales and each staff member&apos;s earnings are snapshotted atomically when the transaction is completed.</p>
          <FormButton pendingLabel="Saving assignments..."><ArrowRight className="h-4 w-4" />Save assignments</FormButton>
        </div>
      </form>
    </section>
  );
}

function StaffAssignmentSection({ data }: { data: AdminTransactionReviewPageData }) {
  const editable = data.transaction.status === "pending" || data.transaction.status === "confirmed";

  return editable ? <StaffAssignmentEditor data={data} /> : <StaffAssignmentReadOnly transaction={data.transaction} />;
}

function TransactionActions({ transaction }: { transaction: AdminTransaction }) {
  const router = useRouter();
  const [confirmState, confirmFormAction] = useActionState(confirmPendingTransactionAction, initialFormActionState);
  const [completeState, completeFormAction] = useActionState(completeConfirmedTransactionAction, initialFormActionState);
  const [cancelState, cancelFormAction] = useActionState(cancelTransactionAction, initialFormActionState);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const cancelDialogRef = useRef<HTMLDivElement>(null);
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null);
  const wasCancelOpenRef = useRef(false);

  useEffect(() => {
    if (confirmState.status === "success" || completeState.status === "success" || cancelState.status === "success") {
      router.refresh();
    }
  }, [cancelState.status, completeState.status, confirmState.status, router]);

  useEffect(() => {
    if (!cancelOpen) {
      if (wasCancelOpenRef.current) {
        wasCancelOpenRef.current = false;
        cancelTriggerRef.current?.focus();
      }
      return;
    }

    wasCancelOpenRef.current = true;
    cancelReasonRef.current?.focus();

    function handleCancelDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setCancelOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = cancelDialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), textarea:not([disabled])"));
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleCancelDialogKeyDown);
    return () => document.removeEventListener("keydown", handleCancelDialogKeyDown);
  }, [cancelOpen]);

  if (transaction.status !== "pending" && transaction.status !== "confirmed") {
    return (
      <div className="rounded-2xl border border-[#dfddd4] bg-[#f7f6f1] p-5 text-sm leading-6 text-[#65635d]">
        This request is <strong className="text-[#3f3f3f]">{statusStyles[transaction.status].title.toLowerCase()}</strong> and has no further review actions.
      </div>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-white p-4 shadow-[0_12px_35px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Decision</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#171717]">{transaction.status === "confirmed" ? "Ready to complete this transaction?" : "What should happen to this request?"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65635d]">{transaction.status === "confirmed" ? "Completion posts this transaction as a sale and deducts its configured inventory usage atomically." : "Confirming accepts the customer request. Cancelling removes it from the active review queue and records an optional internal reason."}</p>
        </div>
        <div className="flex w-full items-center gap-2 rounded-xl bg-[#f7f6f1] px-4 py-3 text-sm font-semibold text-[#65635d] sm:w-auto"><CircleDashed className="h-4 w-4 shrink-0 text-[#a77f00]" />Status changes are audited</div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {transaction.status === "pending" && (
          <form action={confirmFormAction} className="w-full sm:w-auto" onSubmit={(event) => { if (!window.confirm("Confirm this customer request?")) event.preventDefault(); }}>
            <input name="transactionId" type="hidden" value={transaction.id} />
            <FormButton pendingLabel="Confirming..."><CheckCircle className="h-4 w-4" />Confirm request</FormButton>
          </form>
        )}
        {transaction.status === "confirmed" && (
          <form action={completeFormAction} className="w-full sm:w-auto" onSubmit={(event) => { if (!window.confirm("Complete this transaction? This will update sales and deduct inventory.")) event.preventDefault(); }}>
            <input name="transactionId" type="hidden" value={transaction.id} />
            <FormButton pendingLabel="Completing..."><CheckCircle className="h-4 w-4" />COMPLETE TRANSACTION</FormButton>
          </form>
        )}
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#efd0c7] bg-white px-4 text-sm font-bold text-[#b34646] transition-colors hover:bg-[#fff4ef] sm:w-auto" onClick={() => setCancelOpen(true)} ref={cancelTriggerRef} type="button">Cancel request</button>
      </div>

      <div className="mt-4 space-y-3">
        <ActionFeedback state={confirmState} />
        <ActionFeedback state={completeState} />
        <ActionFeedback state={cancelState} />
      </div>

      {cancelOpen && (
        <div aria-describedby="cancel-request-description" aria-labelledby="cancel-request-title" aria-modal="true" className="mt-5 rounded-2xl border border-[#efd0c7] bg-[#fff8f6] p-4 sm:mt-6 sm:p-5" ref={cancelDialogRef} role="dialog">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#b34646]">Cancellation</p>
              <h3 className="mt-1 text-lg font-bold text-[#6f3333]" id="cancel-request-title">Cancel this request?</h3>
              <p className="mt-1 text-sm leading-6 text-[#9f4c47]" id="cancel-request-description">This cannot be undone through the review screen.</p>
            </div>
            <button aria-label="Close cancellation form" className="min-h-9 rounded-lg px-2 text-sm font-bold text-[#9f4c47] hover:bg-white" onClick={() => setCancelOpen(false)} type="button">Close</button>
          </div>
          <form action={cancelFormAction} className="mt-5 space-y-4">
            <input name="transactionId" type="hidden" value={transaction.id} />
            <div>
              <label className={labelClass} htmlFor="transaction-cancellation-reason">Internal reason <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
              <textarea aria-describedby={cancelState.fieldErrors.reason ? "transaction-cancellation-reason-error" : undefined} aria-invalid={Boolean(cancelState.fieldErrors.reason)} className={`${inputClass} min-h-24 py-3`} id="transaction-cancellation-reason" name="reason" placeholder="Why was this request cancelled?" ref={cancelReasonRef} />
              <FieldError id="transaction-cancellation-reason-error" message={cancelState.fieldErrors.reason} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button className="min-h-11 w-full rounded-xl border border-[#efd0c7] bg-white px-4 text-sm font-bold text-[#9f4c47] sm:w-auto" onClick={() => setCancelOpen(false)} type="button">Keep request</button>
              <FormButton pendingLabel="Cancelling..." tone="danger">Cancel request</FormButton>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function TransactionTimeline({ transaction }: { transaction: AdminTransaction }) {
  return (
    <section className="rounded-2xl border border-[#dfddd4] bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Clock className="h-4 w-4" /></span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Record history</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#171717]">Submission timeline</h2>
        </div>
      </div>
       <dl className="mt-5 space-y-3 text-sm">
          <div className="flex flex-col gap-1 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-start sm:justify-between"><dt className="text-[#89867d]">Submitted</dt><dd className="font-semibold text-[#3f3f3f] sm:text-right">{formatDateTime(transaction.createdAt)}</dd></div>
          <div className="flex flex-col gap-1 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-start sm:justify-between"><dt className="text-[#89867d]">Last updated</dt><dd className="font-semibold text-[#3f3f3f] sm:text-right">{formatDateTime(transaction.updatedAt)}</dd></div>
           {transaction.confirmedAt && <div className="flex flex-col gap-1 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-start sm:justify-between"><dt className="text-[#89867d]">Confirmed</dt><dd className="font-semibold text-[#a77f00] sm:text-right">{formatDateTime(transaction.confirmedAt)}</dd></div>}
           {transaction.completedAt && <div className="flex flex-col gap-1 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-start sm:justify-between"><dt className="text-[#89867d]">Completed</dt><dd className="font-semibold text-[#3f3f3f] sm:text-right">{formatDateTime(transaction.completedAt)}</dd></div>}
          {transaction.cancelledAt && <div className="flex flex-col gap-1 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-start sm:justify-between"><dt className="text-[#89867d]">Cancelled</dt><dd className="font-semibold text-[#b34646] sm:text-right">{formatDateTime(transaction.cancelledAt)}</dd></div>}
         {transaction.cancellationReason && <div><dt className="text-[#89867d]">Internal reason</dt><dd className="mt-1 leading-6 text-[#65635d]">{transaction.cancellationReason}</dd></div>}
      </dl>
    </section>
  );
}

export function TransactionReview({ data }: { data: AdminTransactionReviewPageData }) {
  const { transaction } = data;
  const editable = transaction.status === "pending";

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <Link className="inline-flex min-h-10 items-center gap-1 rounded-lg px-1 text-sm font-bold text-[#a77f00] hover:text-[#756000]" href="/admin"><ChevronRight className="h-4 w-4 rotate-180" />Back to incoming check-ins</Link>
        <div className="mt-4 flex flex-col gap-4 sm:mt-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Transaction review</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">{transaction.transactionNumber}</h1>
            <p className="mt-3 text-sm leading-6 text-[#65635d]">Submitted {formatDateTime(transaction.createdAt)} by {customerDisplayName(transaction)}.</p>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-4">
          {editable ? <TransactionEditForm data={data} /> : <ReadOnlyDetails transaction={transaction} />}

          <section className="rounded-[1.5rem] border border-[#dfddd4] bg-white p-4 shadow-[0_12px_35px_rgba(0,0,0,0.04)] sm:p-6">
            <SectionHeading
              description="These are the service and product snapshots currently stored on the request."
              eyebrow="Request contents"
              icon={<Sparkles className="h-4 w-4" />}
              title="Selected services and products"
            />
            <div className="mt-5"><SummaryLines transaction={transaction} /></div>
            <div className="mt-5 grid gap-3 border-t border-[#e8e5dc] pt-5 sm:grid-cols-3">
              <div><p className="text-xs text-[#89867d]">Services</p><p className="mt-1 font-bold text-[#3f3f3f]">{formatCurrency(transaction.serviceSubtotal)}</p></div>
              <div><p className="text-xs text-[#89867d]">Products</p><p className="mt-1 font-bold text-[#3f3f3f]">{formatCurrency(transaction.productSubtotal)}</p></div>
               <div><p className="text-xs text-[#89867d]">{transaction.status === "completed" ? "Total" : "Request total"}</p><p className="mt-1 text-lg font-black text-[#171717]">{formatCurrency(transaction.total)}</p></div>
           </div>
          </section>
          <StaffAssignmentSection data={data} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] bg-[#171717] p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.14)] sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#f4c400]">Current total</p><p className="mt-3 text-3xl font-black tracking-[-0.05em]">{formatCurrency(transaction.total)}</p></div><CarFront className="h-6 w-6 text-[#f4c400]" /></div>
            <div className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-300"><p>{transaction.vehicle.categoryName}</p><p className="mt-1">{transaction.services.length} service{transaction.services.length === 1 ? "" : "s"} · {transaction.products.length} product{transaction.products.length === 1 ? "" : "s"}</p></div>
          </div>
          <TransactionTimeline transaction={transaction} />
        </aside>
      </div>

      <TransactionActions transaction={transaction} />
      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#89867d]"><CheckCircle className="h-4 w-4 text-[#a77f00]" />Only confirmed transactions can be completed; completion posts sales and deducts inventory atomically.</p>
    </div>
  );
}
