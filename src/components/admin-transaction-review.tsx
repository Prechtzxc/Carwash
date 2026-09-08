"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
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
} from "@/components/icons";
import {
  cancelTransactionAction,
  completeConfirmedTransactionAction,
  confirmPendingTransactionAction,
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
  "min-h-11 w-full rounded-xl border border-[#d7e5e0] bg-white px-3.5 text-sm text-[#18323c] shadow-sm outline-none transition-colors placeholder:text-[#9aa9aa] focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb] disabled:cursor-not-allowed disabled:bg-[#f4f8f7] disabled:text-[#829196]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#607378]";

type ProductDraft = {
  inventoryItemId: string;
  quantity: number;
};

const statusStyles: Record<TransactionStatus, { badge: string; dot: string; title: string }> = {
  pending: { badge: "bg-[#fff3d8] text-[#9a681f]", dot: "bg-[#d49a38]", title: "Awaiting review" },
  confirmed: { badge: "bg-[#e1f6f0] text-[#0d8278]", dot: "bg-[#17a190]", title: "Confirmed" },
  completed: { badge: "bg-[#e8edff] text-[#4b5c9b]", dot: "bg-[#6f83ca]", title: "Completed" },
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
    <div aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${state.status === "success" ? "border-[#bde2d8] bg-[#effaf7] text-[#0d8278]" : "border-[#f0d3c8] bg-[#fff4ef] text-[#9f4c47]"}`}>
      {state.message}
    </div>
  );
}

function FormButton({ children, pendingLabel, tone = "primary" }: { children: ReactNode; pendingLabel: string; tone?: "primary" | "danger" | "quiet" }) {
  const { pending } = useFormStatus();
  const className = tone === "danger"
    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b34646] px-4 text-sm font-bold text-white transition-colors hover:bg-[#963d3d] disabled:cursor-not-allowed disabled:opacity-55"
    : tone === "quiet"
      ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e5e0] bg-white px-4 text-sm font-bold text-[#486168] transition-colors hover:border-[#a8cfc5] hover:text-[#0d8278] disabled:cursor-not-allowed disabled:opacity-55"
      : "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0d8278] px-4 text-sm font-bold text-white transition-colors hover:bg-[#096e67] disabled:cursor-not-allowed disabled:opacity-55";

  return <button className={className} disabled={pending} type="submit">{pending ? pendingLabel : children}</button>;
}

function SectionHeading({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#dce8e4] pb-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]">{icon}</span>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10222e]">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6b7b7f]">{description}</p>
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
          <div>
            <p className="font-semibold text-[#36525a]">{service.name}</p>
            <p className="mt-0.5 text-xs text-[#829196]">{service.sizeClass} · qty {service.quantity}</p>
          </div>
          <p className="shrink-0 font-bold text-[#18323c]">{formatCurrency(service.lineTotal)}</p>
        </div>
      ))}
      {transaction.products.map((product) => (
        <div className="flex items-start justify-between gap-4 text-sm" key={product.id}>
          <div>
            <p className="font-semibold text-[#36525a]">{product.name}</p>
            <p className="mt-0.5 text-xs text-[#829196]">Shop product · qty {product.quantity}</p>
          </div>
          <p className="shrink-0 font-bold text-[#18323c]">{formatCurrency(product.lineTotal)}</p>
        </div>
      ))}
      {transaction.services.length === 0 && transaction.products.length === 0 && <p className="text-sm text-[#829196]">No line items recorded.</p>}
    </div>
  );
}

function ReadOnlyDetails({ transaction }: { transaction: AdminTransaction }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#dce8e4] bg-white p-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Customer</p>
        <p className="mt-3 text-lg font-bold text-[#18323c]">{customerDisplayName(transaction)}</p>
        <dl className="mt-4 space-y-2 text-sm text-[#607378]">
          <div className="flex justify-between gap-4"><dt>Mobile</dt><dd className="text-right font-semibold text-[#36525a]">{transaction.customer.mobile_number}</dd></div>
          <div className="flex justify-between gap-4"><dt>Email</dt><dd className="max-w-[65%] break-words text-right font-semibold text-[#36525a]">{transaction.customer.email ?? "Not provided"}</dd></div>
        </dl>
      </div>
      <div className="rounded-2xl border border-[#dce8e4] bg-white p-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Vehicle</p>
        <p className="mt-3 text-lg font-bold text-[#18323c]">{vehicleDisplayName(transaction)}</p>
        <dl className="mt-4 space-y-2 text-sm text-[#607378]">
          <div className="flex justify-between gap-4"><dt>Plate</dt><dd className="text-right font-semibold text-[#36525a]">{transaction.vehicle.plate_number ?? "Not provided"}</dd></div>
          <div className="flex justify-between gap-4"><dt>Color</dt><dd className="text-right font-semibold text-[#36525a]">{transaction.vehicle.color ?? "Not provided"}</dd></div>
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
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7">
      <SectionHeading
        description="Pending requests can be corrected before confirmation. Prices are recalculated from the active catalog when you save."
        eyebrow="Editable while pending"
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Review and revise details"
      />

      <form action={formAction} className="mt-6 space-y-8">
        <input name="transactionId" type="hidden" value={transaction.id} />
        <input name="serviceIds" type="hidden" value={JSON.stringify(serviceIds)} readOnly />
        <input name="productLines" type="hidden" value={JSON.stringify(productLines)} readOnly />

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#607378]">Customer details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="transaction-first-name">First name</label>
              <input className={inputClass} id="transaction-first-name" name="firstName" onChange={(event) => setFirstName(event.target.value)} value={firstName} />
              <FieldError id="transaction-first-name-error" message={state.fieldErrors.firstName} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-last-name">Last name</label>
              <input className={inputClass} id="transaction-last-name" name="lastName" onChange={(event) => setLastName(event.target.value)} value={lastName} />
              <FieldError id="transaction-last-name-error" message={state.fieldErrors.lastName} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-mobile">Mobile number</label>
              <input className={inputClass} id="transaction-mobile" inputMode="tel" name="mobileNumber" onChange={(event) => setMobileNumber(event.target.value)} value={mobileNumber} />
              <FieldError id="transaction-mobile-error" message={state.fieldErrors.mobileNumber} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-email">Email <span className="font-normal normal-case tracking-normal text-[#9aa9aa]">(optional)</span></label>
              <input className={inputClass} id="transaction-email" name="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
              <FieldError id="transaction-email-error" message={state.fieldErrors.email} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#607378]">Vehicle details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="transaction-category">Vehicle category</label>
              <select className={inputClass} id="transaction-category" name="vehicleCategoryId" onChange={(event) => setVehicleCategoryId(event.target.value)} value={vehicleCategoryId}>
                {!selectedCategory && <option value={transaction.vehicle.vehicle_category_id}>{transaction.vehicle.categoryName} (currently unavailable)</option>}
                {catalog.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {selectedCategoryIsUnavailable && <p className="mt-1.5 text-xs font-semibold text-[#9a681f]">Choose an active category before saving.</p>}
              <FieldError id="transaction-category-error" message={state.fieldErrors.vehicleCategoryId} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-plate">Plate number <span className="font-normal normal-case tracking-normal text-[#9aa9aa]">(optional)</span></label>
              <input className={inputClass} id="transaction-plate" name="plateNumber" onChange={(event) => setPlateNumber(event.target.value)} value={plateNumber} />
              <FieldError id="transaction-plate-error" message={state.fieldErrors.plateNumber} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-color">Color <span className="font-normal normal-case tracking-normal text-[#9aa9aa]">(optional)</span></label>
              <input className={inputClass} id="transaction-color" name="color" onChange={(event) => setColor(event.target.value)} value={color} />
              <FieldError id="transaction-color-error" message={state.fieldErrors.color} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-make">Make <span className="font-normal normal-case tracking-normal text-[#9aa9aa]">(optional)</span></label>
              <input className={inputClass} id="transaction-make" name="make" onChange={(event) => setMake(event.target.value)} value={make} />
              <FieldError id="transaction-make-error" message={state.fieldErrors.make} />
            </div>
            <div>
              <label className={labelClass} htmlFor="transaction-model">Model <span className="font-normal normal-case tracking-normal text-[#9aa9aa]">(optional)</span></label>
              <input className={inputClass} id="transaction-model" name="model" onChange={(event) => setModel(event.target.value)} value={model} />
              <FieldError id="transaction-model-error" message={state.fieldErrors.model} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#607378]">Services</h3>
              <p className="mt-1 text-sm text-[#829196]">Select the services to keep on this request.</p>
            </div>
            <p className="text-sm font-bold text-[#18323c]">{formatCurrency(selectedServiceTotal)}</p>
          </div>
          <div aria-describedby={state.fieldErrors.serviceIds ? "transaction-services-error" : undefined} className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalog.services.map((service) => {
              const price = getServicePrice(catalog, service.id, sizeClass);
              const selected = serviceIds.includes(service.id);

              return (
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${selected ? "border-[#9acdc3] bg-[#effaf7]" : "border-[#dce8e4] bg-white hover:border-[#b9d4ce]"}`} key={service.id}>
                  <input checked={selected} className="mt-1 h-4 w-4 accent-[#0d8278]" onChange={() => toggleService(service.id)} type="checkbox" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-bold text-[#36525a]">{service.name}</span>
                      <span className="shrink-0 text-sm font-bold text-[#18323c]">{price === null ? "Unavailable" : formatCurrency(price)}</span>
                    </span>
                    {service.description && <span className="mt-1 block text-xs leading-5 text-[#829196]">{service.description}</span>}
                  </span>
                </label>
              );
            })}
            {transaction.services.filter((service) => !catalog.services.some((candidate) => candidate.id === service.serviceId)).map((service) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#f1dfbd] bg-[#fffaf0] p-4" key={service.serviceId}>
                <input checked={serviceIds.includes(service.serviceId)} className="mt-1 h-4 w-4 accent-[#0d8278]" onChange={() => toggleService(service.serviceId)} type="checkbox" />
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-[#7b5a29]">{service.name} (currently unavailable)</span>
                  <span className="mt-1 block text-xs leading-5 text-[#9a681f]">Remove this service or replace it with an active service before saving.</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="transaction-services-error" message={state.fieldErrors.serviceIds} />
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[#607378]">Shop products</h3>
              <p className="mt-1 text-sm text-[#829196]">Optional products use the active selling price at save time.</p>
            </div>
            <p className="text-sm font-bold text-[#18323c]">{formatCurrency(selectedProductTotal)}</p>
          </div>
          <div className="mt-4 space-y-3">
            {productLines.map((line, index) => {
              const product = catalog.products.find((candidate) => candidate.id === line.inventoryItemId);
              const name = getProductName(catalog, transaction, line.inventoryItemId);

              return (
                <div className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_130px_auto] sm:items-end ${product ? "border-[#dce8e4] bg-white" : "border-[#f1dfbd] bg-[#fffaf0]"}`} key={`${line.inventoryItemId}-${index}`}>
                  <div>
                    <label className={labelClass} htmlFor={`transaction-product-${index}`}>Product</label>
                    <select className={inputClass} id={`transaction-product-${index}`} onChange={(event) => updateProduct(index, { inventoryItemId: event.target.value })} value={line.inventoryItemId}>
                      {!product && <option value={line.inventoryItemId}>{name} (currently unavailable)</option>}
                      {catalog.products.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {formatCurrency(candidate.selling_price)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`transaction-product-quantity-${index}`}>Quantity</label>
                    <input className={inputClass} id={`transaction-product-quantity-${index}`} inputMode="numeric" min="1" max="99" onChange={(event) => updateProduct(index, { quantity: Number(event.target.value) || 0 })} type="number" value={line.quantity || ""} />
                  </div>
                  <button className="min-h-11 rounded-xl border border-[#efd0c7] px-3 text-sm font-bold text-[#b34646] transition-colors hover:bg-[#fff4ef]" onClick={() => removeProduct(index)} type="button">Remove</button>
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
            {productLines.length === 0 && <p className="rounded-xl border border-dashed border-[#b9d4ce] bg-white p-4 text-sm text-[#829196]">No shop products selected.</p>}
          </div>
          <FieldError id="transaction-products-error" message={state.fieldErrors.productLines} />
        </div>

        <div className="rounded-2xl border border-[#ccebe3] bg-[#e9f8f4] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#0d8278]">Recalculated estimate</p>
              <p className="mt-1 text-sm leading-6 text-[#52706e]">The database will recalculate and snapshot the active prices atomically.</p>
            </div>
            <p className="text-2xl font-black tracking-[-0.04em] text-[#102c38]">{formatCurrency(selectedServiceTotal + selectedProductTotal)}</p>
          </div>
        </div>

        <ActionFeedback state={state} />
        <div className="flex flex-col gap-3 border-t border-[#dce8e4] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-[#829196]">Saving is only available while this request is pending. Confirmation and cancellation remain separate decisions.</p>
          <FormButton pendingLabel="Saving changes..."><ArrowRight className="h-4 w-4" />Save changes</FormButton>
        </div>
      </form>
    </section>
  );
}

function TransactionActions({ transaction }: { transaction: AdminTransaction }) {
  const router = useRouter();
  const [confirmState, confirmFormAction] = useActionState(confirmPendingTransactionAction, initialFormActionState);
  const [completeState, completeFormAction] = useActionState(completeConfirmedTransactionAction, initialFormActionState);
  const [cancelState, cancelFormAction] = useActionState(cancelTransactionAction, initialFormActionState);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (confirmState.status === "success" || completeState.status === "success" || cancelState.status === "success") {
      router.refresh();
    }
  }, [cancelState.status, completeState.status, confirmState.status, router]);

  if (transaction.status !== "pending" && transaction.status !== "confirmed") {
    return (
      <div className="rounded-2xl border border-[#dce8e4] bg-[#f8fbfa] p-5 text-sm leading-6 text-[#6b7b7f]">
        This request is <strong className="text-[#36525a]">{statusStyles[transaction.status].title.toLowerCase()}</strong> and has no further review actions.
      </div>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Decision</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#10222e]">{transaction.status === "confirmed" ? "Ready to complete this transaction?" : "What should happen to this request?"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7b7f]">{transaction.status === "confirmed" ? "Completion posts this transaction as a sale and deducts its configured inventory usage atomically." : "Confirming accepts the customer request. Cancelling removes it from the active review queue and records an optional internal reason."}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#f4f8f7] px-4 py-3 text-sm font-semibold text-[#607378]"><CircleDashed className="h-4 w-4 text-[#0d8278]" />Status changes are audited</div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {transaction.status === "pending" && (
          <form action={confirmFormAction} onSubmit={(event) => { if (!window.confirm("Confirm this customer request?")) event.preventDefault(); }}>
            <input name="transactionId" type="hidden" value={transaction.id} />
            <FormButton pendingLabel="Confirming..."><CheckCircle className="h-4 w-4" />Confirm request</FormButton>
          </form>
        )}
        {transaction.status === "confirmed" && (
          <form action={completeFormAction} onSubmit={(event) => { if (!window.confirm("Complete this transaction? This will update sales and deduct inventory.")) event.preventDefault(); }}>
            <input name="transactionId" type="hidden" value={transaction.id} />
            <FormButton pendingLabel="Completing..."><CheckCircle className="h-4 w-4" />COMPLETE TRANSACTION</FormButton>
          </form>
        )}
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#efd0c7] bg-white px-4 text-sm font-bold text-[#b34646] transition-colors hover:bg-[#fff4ef]" onClick={() => setCancelOpen(true)} type="button">Cancel request</button>
      </div>

      <div className="mt-4 space-y-3">
        <ActionFeedback state={confirmState} />
        <ActionFeedback state={completeState} />
        <ActionFeedback state={cancelState} />
      </div>

      {cancelOpen && (
        <div aria-labelledby="cancel-request-title" aria-modal="true" className="mt-6 rounded-2xl border border-[#efd0c7] bg-[#fff8f6] p-5" role="dialog">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#b34646]">Cancellation</p>
              <h3 className="mt-1 text-lg font-bold text-[#6f3333]" id="cancel-request-title">Cancel this request?</h3>
              <p className="mt-1 text-sm leading-6 text-[#9f4c47]">This cannot be undone through the review screen.</p>
            </div>
            <button aria-label="Close cancellation form" className="min-h-9 rounded-lg px-2 text-sm font-bold text-[#9f4c47] hover:bg-white" onClick={() => setCancelOpen(false)} type="button">Close</button>
          </div>
          <form action={cancelFormAction} className="mt-5 space-y-4">
            <input name="transactionId" type="hidden" value={transaction.id} />
            <div>
              <label className={labelClass} htmlFor="transaction-cancellation-reason">Internal reason <span className="font-normal normal-case tracking-normal text-[#9aa9aa]">(optional)</span></label>
              <textarea className={`${inputClass} min-h-24 py-3`} id="transaction-cancellation-reason" name="reason" placeholder="Why was this request cancelled?" />
              <FieldError id="transaction-cancellation-reason-error" message={cancelState.fieldErrors.reason} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button className="min-h-11 rounded-xl border border-[#efd0c7] bg-white px-4 text-sm font-bold text-[#9f4c47]" onClick={() => setCancelOpen(false)} type="button">Keep request</button>
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
    <section className="rounded-2xl border border-[#dce8e4] bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]"><Clock className="h-4 w-4" /></span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#829196]">Record history</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10222e]">Submission timeline</h2>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2f0] pb-3"><dt className="text-[#829196]">Submitted</dt><dd className="text-right font-semibold text-[#36525a]">{formatDateTime(transaction.createdAt)}</dd></div>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2f0] pb-3"><dt className="text-[#829196]">Last updated</dt><dd className="text-right font-semibold text-[#36525a]">{formatDateTime(transaction.updatedAt)}</dd></div>
         {transaction.confirmedAt && <div className="flex items-start justify-between gap-4 border-b border-[#edf2f0] pb-3"><dt className="text-[#829196]">Confirmed</dt><dd className="text-right font-semibold text-[#0d8278]">{formatDateTime(transaction.confirmedAt)}</dd></div>}
         {transaction.completedAt && <div className="flex items-start justify-between gap-4 border-b border-[#edf2f0] pb-3"><dt className="text-[#829196]">Completed</dt><dd className="text-right font-semibold text-[#4b5c9b]">{formatDateTime(transaction.completedAt)}</dd></div>}
         {transaction.cancelledAt && <div className="flex items-start justify-between gap-4 border-b border-[#edf2f0] pb-3"><dt className="text-[#829196]">Cancelled</dt><dd className="text-right font-semibold text-[#b34646]">{formatDateTime(transaction.cancelledAt)}</dd></div>}
        {transaction.cancellationReason && <div><dt className="text-[#829196]">Internal reason</dt><dd className="mt-1 leading-6 text-[#607378]">{transaction.cancellationReason}</dd></div>}
      </dl>
    </section>
  );
}

export function TransactionReview({ data }: { data: AdminTransactionReviewPageData }) {
  const { transaction } = data;
  const editable = transaction.status === "pending";

  return (
    <div className="space-y-8">
      <header>
        <Link className="inline-flex items-center gap-1 text-sm font-bold text-[#0d8278] hover:text-[#096e67]" href="/admin"><ChevronRight className="h-4 w-4 rotate-180" />Back to incoming check-ins</Link>
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Transaction review</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e] sm:text-4xl">{transaction.transactionNumber}</h1>
            <p className="mt-3 text-sm leading-6 text-[#6b7b7f]">Submitted {formatDateTime(transaction.createdAt)} by {customerDisplayName(transaction)}.</p>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-5">
          {editable ? <TransactionEditForm data={data} /> : <ReadOnlyDetails transaction={transaction} />}

          <section className="rounded-[1.5rem] border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] sm:p-7">
            <SectionHeading
              description="These are the service and product snapshots currently stored on the request."
              eyebrow="Request contents"
              icon={<Sparkles className="h-4 w-4" />}
              title="Selected services and products"
            />
            <div className="mt-6"><SummaryLines transaction={transaction} /></div>
            <div className="mt-6 grid gap-3 border-t border-[#edf2f0] pt-5 sm:grid-cols-3">
              <div><p className="text-xs text-[#829196]">Services</p><p className="mt-1 font-bold text-[#36525a]">{formatCurrency(transaction.serviceSubtotal)}</p></div>
              <div><p className="text-xs text-[#829196]">Products</p><p className="mt-1 font-bold text-[#36525a]">{formatCurrency(transaction.productSubtotal)}</p></div>
               <div><p className="text-xs text-[#829196]">{transaction.status === "completed" ? "Total" : "Request total"}</p><p className="mt-1 text-lg font-black text-[#102c38]">{formatCurrency(transaction.total)}</p></div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] bg-[#102c38] p-6 text-white shadow-[0_18px_42px_rgba(16,44,56,0.14)]">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#8fe7da]">Current total</p><p className="mt-3 text-3xl font-black tracking-[-0.05em]">{formatCurrency(transaction.total)}</p></div><CarFront className="h-6 w-6 text-[#9cefe2]" /></div>
            <div className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-300"><p>{transaction.vehicle.categoryName}</p><p className="mt-1">{transaction.services.length} service{transaction.services.length === 1 ? "" : "s"} · {transaction.products.length} product{transaction.products.length === 1 ? "" : "s"}</p></div>
          </div>
          <TransactionTimeline transaction={transaction} />
        </aside>
      </div>

      <TransactionActions transaction={transaction} />
      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196]"><CheckCircle className="h-4 w-4 text-[#0d9f91]" />Only confirmed transactions can be completed; completion posts sales and deducts inventory atomically.</p>
    </div>
  );
}
