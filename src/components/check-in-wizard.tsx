"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { ArrowRight, CarFront, CheckCircle, ChevronRight, ClipboardCheck, Droplets, Sparkles } from "@/components/icons";
import { submitPublicCheckInAction } from "@/app/check-in/actions";
import { BrandMark } from "@/components/brand-mark";
import { initialCheckInActionState, type CheckInActionState } from "@/lib/check-in/state";
import type {
  CheckInProductLine,
  CheckInSuccessResult,
  PublicCheckInCatalog,
  PublicService,
  PublicShopProduct,
  PublicVehicleCategory,
} from "@/types/check-in";

type Step = 1 | 2 | 3 | 4 | 5;

const steps: Array<{ id: Step; label: string; mobileLabel: string }> = [
  { id: 1, label: "Customer details", mobileLabel: "Details" },
  { id: 2, label: "Vehicle", mobileLabel: "Vehicle" },
  { id: 3, label: "Services", mobileLabel: "Services" },
  { id: 4, label: "Shop products", mobileLabel: "Products" },
  { id: 5, label: "Review & submit", mobileLabel: "Review" },
];

type CustomerDetails = {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
};

type VehicleDetails = {
  plateNumber: string;
  make: string;
  model: string;
  color: string;
};

const initialCustomerDetails: CustomerDetails = {
  firstName: "",
  lastName: "",
  mobileNumber: "",
  email: "",
};

const initialVehicleDetails: VehicleDetails = {
  plateNumber: "",
  make: "",
  model: "",
  color: "",
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-[#dedbd1] bg-white px-4 text-base text-[#2b2b2b] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#65635d]";

function formatCurrency(value: number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "PHP 0.00";
  }

  return `PHP ${amount.toLocaleString("en-PH", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function getFieldError(state: CheckInActionState, field: string) {
  return state.fieldErrors?.[field];
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-semibold text-[#b34646]" id={id}>{message}</p>;
}

function ActionFeedback({ state }: { state: CheckInActionState }) {
  if (state.status !== "error" || !state.message) {
    return null;
  }

  return (
    <div aria-live="polite" className="rounded-xl border border-[#f0d3c8] bg-[#fff4ef] px-4 py-3 text-sm font-semibold leading-6 text-[#9f4c47]">
      {state.message}
    </div>
  );
}

function ValidationSummary({ state }: { state: CheckInActionState }) {
  const messages = Object.values(state.fieldErrors ?? {});

  if (state.status !== "error" || messages.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="mt-4 rounded-xl border border-[#f0d3c8] bg-[#fff8f6] px-4 py-3 text-sm leading-6 text-[#9f4c47]" role="alert">
      {messages.map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}
    </div>
  );
}

function SubmitButton({ disabled, pending: actionPending, pendingLabel = "Submitting..." }: { disabled?: boolean; pending?: boolean; pendingLabel?: string }) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || actionPending;

  return (
    <button
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f4c400] px-6 text-base font-bold text-[#171717] shadow-[0_12px_25px_rgba(177,139,0,0.2)] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? pendingLabel : "Submit request"}
      {!pending && <ArrowRight className="h-5 w-5" />}
    </button>
  );
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const current = steps[currentStep - 1];

  return (
    <div className="rounded-2xl border border-[#dfddd4] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#89867d]">Step {currentStep} of {steps.length}</p>
          <p className="mt-1 text-sm font-bold text-[#292929]">{current.label}</p>
        </div>
        <span className="rounded-full bg-[#fff7cc] px-3 py-1.5 text-xs font-bold text-[#756000]">Your request</span>
      </div>
      <ol aria-label="Check-in progress" className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-2">
        {steps.map((step) => (
          <li aria-current={step.id === currentStep ? "step" : undefined} className="min-w-0" key={step.id}>
            <div className={`h-2 rounded-full ${step.id <= currentStep ? "bg-[#f4c400]" : "bg-[#e7e4da]"}`} />
            <p className={`mt-2 truncate text-[0.62rem] font-bold uppercase tracking-[0.08em] ${step.id === currentStep ? "text-[#756000]" : "text-[#9a978d]"}`}>
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.mobileLabel}</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#a77f00]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.045em] text-[#171717] outline-none sm:text-3xl" id="check-in-step-heading">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65635d] sm:text-base">{description}</p>
    </div>
  );
}

function CustomerDetailsStep({
  details,
  onChange,
  state,
}: {
  details: CustomerDetails;
  onChange: (field: keyof CustomerDetails, value: string) => void;
  state: CheckInActionState;
}) {
  return (
    <div>
      <StepHeading
        description="Tell us who we should call when your car is ready. No account or login is needed."
        eyebrow="First, a quick hello"
        title="Who are we checking in?"
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="check-in-first-name">First name</label>
          <input
            aria-describedby={getFieldError(state, "firstName") ? "check-in-first-name-error" : undefined}
            aria-invalid={Boolean(getFieldError(state, "firstName"))}
            autoComplete="given-name"
            className={`${inputClass} mt-2`}
            id="check-in-first-name"
            onChange={(event) => onChange("firstName", event.target.value)}
            placeholder="e.g. Ana"
            required
            value={details.firstName}
          />
          <FieldError id="check-in-first-name-error" message={getFieldError(state, "firstName")} />
        </div>
        <div>
          <label className={labelClass} htmlFor="check-in-last-name">Last name</label>
          <input
            aria-describedby={getFieldError(state, "lastName") ? "check-in-last-name-error" : undefined}
            aria-invalid={Boolean(getFieldError(state, "lastName"))}
            autoComplete="family-name"
            className={`${inputClass} mt-2`}
            id="check-in-last-name"
            onChange={(event) => onChange("lastName", event.target.value)}
            placeholder="e.g. Reyes"
            required
            value={details.lastName}
          />
          <FieldError id="check-in-last-name-error" message={getFieldError(state, "lastName")} />
        </div>
        <div>
          <label className={labelClass} htmlFor="check-in-mobile">Mobile number</label>
          <input
            aria-describedby={getFieldError(state, "mobileNumber") ? "check-in-mobile-error" : undefined}
            aria-invalid={Boolean(getFieldError(state, "mobileNumber"))}
            autoComplete="tel"
            className={`${inputClass} mt-2`}
            id="check-in-mobile"
            inputMode="tel"
            onChange={(event) => onChange("mobileNumber", event.target.value)}
            placeholder="09XX XXX XXXX"
            required
            type="tel"
            value={details.mobileNumber}
          />
           <p className="mt-2 text-xs leading-5 text-[#817e75]">Philippine mobile numbers only. We use this privately to avoid duplicate customer records.</p>
          <FieldError id="check-in-mobile-error" message={getFieldError(state, "mobileNumber")} />
        </div>
        <div>
           <label className={labelClass} htmlFor="check-in-email">Email <span className="font-medium normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
          <input
            aria-describedby={getFieldError(state, "email") ? "check-in-email-error" : undefined}
            aria-invalid={Boolean(getFieldError(state, "email"))}
            autoComplete="email"
            className={`${inputClass} mt-2`}
            id="check-in-email"
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={details.email}
          />
          <FieldError id="check-in-email-error" message={getFieldError(state, "email")} />
        </div>
      </div>
    </div>
  );
}

function VehicleStep({
  categories,
  selectedCategoryId,
  details,
  onCategoryChange,
  onDetailChange,
  state,
}: {
  categories: PublicVehicleCategory[];
  selectedCategoryId: string;
  details: VehicleDetails;
  onCategoryChange: (id: string) => void;
  onDetailChange: (field: keyof VehicleDetails, value: string) => void;
  state: CheckInActionState;
}) {
  return (
    <div>
      <StepHeading
        description="Choose the vehicle category that best fits your car. We use it behind the scenes to show the right service prices."
        eyebrow="Choose your vehicle"
        title="What are we washing today?"
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length > 0 ? categories.map((category) => {
          const selected = selectedCategoryId === category.id;

          return (
            <button
              aria-pressed={selected}
              aria-describedby={getFieldError(state, "vehicleCategoryId") ? "check-in-category-error" : undefined}
               className={`min-h-20 rounded-2xl border p-4 text-left transition-all ${selected ? "border-[#c7a900] bg-[#fff7cc] shadow-[0_8px_20px_rgba(177,139,0,0.12)]" : "border-[#dfddd4] bg-white hover:border-[#d4b900] hover:bg-[#fffdf2]"}`}
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              type="button"
            >
               <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-[#f4c400] text-[#171717]" : "bg-[#f2f1eb] text-[#756000]"}`}>
                <CarFront className="h-5 w-5" />
              </span>
               <span className="mt-3 block text-base font-bold text-[#292929]">{category.name}</span>
            </button>
          );
        }) : (
           <p className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d] sm:col-span-2 lg:col-span-3">Vehicle categories are not available right now. Please ask the counter team for help.</p>
        )}
      </div>
      <FieldError id="check-in-category-error" message={getFieldError(state, "vehicleCategoryId")} />

       <div className="mt-8 border-t border-[#e8e5dc] pt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className={labelClass}>Vehicle details</p>
             <p className="mt-1 text-sm text-[#817e75]">Optional, but useful for a quick handoff.</p>
          </div>
           <span className="rounded-full bg-[#f2f1eb] px-3 py-1.5 text-xs font-bold text-[#6e6b64]">Optional</span>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {([
            ["plateNumber", "Plate number", "e.g. ABC 1234", "text"],
            ["make", "Make", "e.g. Toyota", "text"],
            ["model", "Model", "e.g. Vios", "text"],
            ["color", "Color", "e.g. White", "text"],
          ] as const).map(([field, label, placeholder, type]) => (
            <div key={field}>
              <label className={labelClass} htmlFor={`check-in-${field}`}>{label}</label>
              <input
                aria-describedby={getFieldError(state, field) ? `check-in-${field}-error` : undefined}
                aria-invalid={Boolean(getFieldError(state, field))}
                className={`${inputClass} mt-2`}
                id={`check-in-${field}`}
                onChange={(event) => onDetailChange(field, event.target.value)}
                placeholder={placeholder}
                type={type}
                value={details[field]}
              />
              <FieldError id={`check-in-${field}-error`} message={getFieldError(state, field)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceStep({
  services,
  prices,
  categoryId,
  selectedIds,
  onToggle,
  state,
}: {
  services: PublicService[];
  prices: PublicCheckInCatalog["servicePrices"];
  categoryId: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
  state: CheckInActionState;
}) {
  function getPrice(serviceId: string) {
    return prices.find((price) => price.serviceId === serviceId && price.vehicleCategoryId === categoryId)?.price ?? null;
  }

  return (
    <div>
      <StepHeading
        description="Select one or more services. Prices are based on the vehicle category you chose."
        eyebrow="Choose your services"
        title="What would you like us to do?"
      />
       {!categoryId && <p className="mt-6 rounded-xl border border-[#ead98a] bg-[#fff9d9] px-4 py-3 text-sm font-semibold leading-6 text-[#756000]">Go back and choose a vehicle first so we can show accurate prices.</p>}
      <div className="mt-8 space-y-3">
        {services.length > 0 ? services.map((service) => {
          const price = getPrice(service.id);
          const selected = selectedIds.includes(service.id);
          const unavailable = price === null;

          return (
            <button
              aria-disabled={unavailable}
              aria-describedby={getFieldError(state, "serviceIds") ? "check-in-services-error" : undefined}
              aria-pressed={selected}
               className={`flex min-h-24 w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all ${unavailable ? "cursor-not-allowed border-[#e7e4da] bg-[#f7f6f1] opacity-65" : selected ? "border-[#c7a900] bg-[#fff7cc] shadow-[0_8px_20px_rgba(177,139,0,0.12)]" : "border-[#dfddd4] bg-white hover:border-[#d4b900]"}`}
              disabled={!categoryId || unavailable}
              key={service.id}
              onClick={() => onToggle(service.id)}
              type="button"
            >
              <span className="flex min-w-0 items-start gap-4">
                 <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-[#f4c400] text-[#171717]" : "bg-[#f2f1eb] text-[#756000]"}`}>
                  {selected ? <CheckCircle className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                </span>
                <span className="min-w-0">
                   <span className="block text-base font-bold text-[#292929]">{service.name}</span>
                   <span className="mt-1 block text-sm leading-5 text-[#706e67]">{service.description || "A focused carwash service."}</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                 <span className="block text-base font-bold text-[#756000]">{price === null ? "Price unavailable" : formatCurrency(price)}</span>
                 {!unavailable && <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#89867d]">per service</span>}
              </span>
            </button>
          );
        }) : (
           <p className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">No services are available right now. Please ask the counter team for help.</p>
        )}
      </div>
      <FieldError id="check-in-services-error" message={getFieldError(state, "serviceIds")} />
    </div>
  );
}

function ProductQuantityControl({ product, quantity, onChange }: { product: PublicShopProduct; quantity: number; onChange: (quantity: number) => void }) {
  if (quantity === 0) {
    return (
     <button className="min-h-11 rounded-xl border border-[#d4b900] bg-white px-4 text-sm font-bold text-[#756000] transition-colors hover:bg-[#fff7cc]" onClick={() => onChange(1)} type="button">
        Add product
      </button>
    );
  }

  return (
   <span className="inline-flex min-h-14 items-center rounded-xl border border-[#d2cec2] bg-white p-1 shadow-sm">
       <button aria-label={`Remove one ${product.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl font-medium text-[#4a4945] transition-colors hover:bg-[#f2f1eb]" onClick={() => onChange(Math.max(0, quantity - 1))} type="button">−</button>
       <span aria-live="polite" className="min-w-9 text-center text-base font-bold text-[#292929]">{quantity}</span>
       <button aria-label={`Add one ${product.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl font-medium text-[#756000] transition-colors hover:bg-[#fff7cc]" onClick={() => onChange(Math.min(99, quantity + 1))} type="button">+</button>
    </span>
  );
}

function ProductStep({
  products,
  quantities,
  onQuantityChange,
  state,
}: {
  products: PublicShopProduct[];
  quantities: Record<string, number>;
  onQuantityChange: (id: string, quantity: number) => void;
  state: CheckInActionState;
}) {
  return (
    <div>
      <StepHeading
        description="These optional shop products can be added to your request. They will not change inventory until a later admin workflow."
        eyebrow="Optional extras"
        title="Anything else for the visit?"
      />
      <div aria-describedby={getFieldError(state, "productLines") ? "check-in-products-error" : undefined} className="mt-8 space-y-3">
        {products.length > 0 ? products.map((product) => {
          const quantity = quantities[product.id] ?? 0;

          return (
             <article className={`flex min-h-24 flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${quantity > 0 ? "border-[#c7a900] bg-[#fff7cc]" : "border-[#dfddd4] bg-white"}`} key={product.id}>
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><Sparkles className="h-5 w-5" /></span>
                <div className="min-w-0">
                   <h3 className="text-base font-bold text-[#292929]">{product.name}</h3>
                   <p className="mt-1 text-sm leading-5 text-[#706e67]">{product.description || "An optional shop product."}</p>
                   <p className="mt-2 text-sm font-bold text-[#756000]">{formatCurrency(product.sellingPrice)}</p>
                </div>
              </div>
              <ProductQuantityControl onChange={(value) => onQuantityChange(product.id, value)} product={product} quantity={quantity} />
            </article>
          );
        }) : (
           <p className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-5 text-sm leading-6 text-[#65635d]">There are no optional products available right now. You can continue without one.</p>
        )}
      </div>
      <FieldError id="check-in-products-error" message={getFieldError(state, "productLines")} />
    </div>
  );
}

type SelectedService = {
  service: PublicService;
  price: number | null;
};

type SelectedProduct = {
  product: PublicShopProduct;
  quantity: number;
};

function ReviewStep({
  details,
  vehicleDetails,
  category,
  services,
  products,
  serviceSubtotal,
  productSubtotal,
  total,
  onEdit,
}: {
  details: CustomerDetails;
  vehicleDetails: VehicleDetails;
  category?: PublicVehicleCategory;
  services: SelectedService[];
  products: SelectedProduct[];
  serviceSubtotal: number;
  productSubtotal: number;
  total: number;
  onEdit: (step: Step) => void;
}) {
  const vehicleDescription = [vehicleDetails.make, vehicleDetails.model, vehicleDetails.color, vehicleDetails.plateNumber].filter(Boolean).join(" · ");

  return (
    <div>
      <StepHeading
        description="Take one last look. Your request will be sent to the wash team as pending for the next step."
        eyebrow="Almost there"
        title="Review your request"
      />

      <div className="mt-8 space-y-4">
        <ReviewBlock actionLabel="Edit" onEdit={() => onEdit(1)} title="Customer details">
           <p className="font-bold text-[#292929]">{details.firstName} {details.lastName}</p>
           <p className="mt-1 text-sm text-[#706e67]">{details.mobileNumber}{details.email ? ` · ${details.email}` : ""}</p>
        </ReviewBlock>
        <ReviewBlock actionLabel="Edit" onEdit={() => onEdit(2)} title="Vehicle">
           <p className="font-bold text-[#292929]">{category?.name ?? "Vehicle category not selected"}</p>
           {vehicleDescription && <p className="mt-1 text-sm text-[#706e67]">{vehicleDescription}</p>}
        </ReviewBlock>
        <ReviewBlock actionLabel="Edit" onEdit={() => onEdit(3)} title="Services">
          <div className="space-y-2">
            {services.map(({ service, price }) => (
              <div className="flex items-start justify-between gap-4 text-sm" key={service.id}>
                 <span className="min-w-0 break-words font-semibold text-[#4a4945]">{service.name}</span>
                 <span className="shrink-0 font-bold text-[#292929]">{price === null ? "Price unavailable" : formatCurrency(price)}</span>
              </div>
            ))}
          </div>
        </ReviewBlock>
        <ReviewBlock actionLabel="Edit" onEdit={() => onEdit(4)} title="Shop products">
          {products.length > 0 ? (
            <div className="space-y-2">
              {products.map(({ product, quantity }) => (
                <div className="flex items-start justify-between gap-4 text-sm" key={product.id}>
                   <span className="min-w-0 break-words font-semibold text-[#4a4945]">{product.name} <span className="font-normal text-[#89867d]">x{quantity}</span></span>
                   <span className="shrink-0 font-bold text-[#292929]">{formatCurrency(product.sellingPrice * quantity)}</span>
                </div>
              ))}
            </div>
           ) : <p className="text-sm text-[#817e75]">No optional products added.</p>}
        </ReviewBlock>
      </div>

       <div className="mt-6 rounded-2xl bg-[#171717] p-5 text-white sm:p-6">
         <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm text-slate-300">
          <span>Service subtotal</span>
          <span className="font-bold text-white">{formatCurrency(serviceSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 py-3 text-sm text-slate-300">
          <span>Shop product subtotal</span>
          <span className="font-bold text-white">{formatCurrency(productSubtotal)}</span>
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
           <span className="text-sm font-bold uppercase tracking-[0.14em] text-[#f4c400]">Estimated total</span>
          <span className="text-2xl font-bold tracking-[-0.04em] text-white">{formatCurrency(total)}</span>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">This is an estimate for your request.</p>
      </div>
    </div>
  );
}

function ReviewBlock({ actionLabel, children, onEdit, title }: { actionLabel: string; children: React.ReactNode; onEdit: () => void; title: string }) {
  return (
       <section className="rounded-2xl border border-[#dfddd4] bg-white p-5">
       <div className="flex items-start justify-between gap-4">
         <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#65635d]">{title}</h3>
         <button className="min-h-9 rounded-lg px-2 text-xs font-bold text-[#756000] transition-colors hover:bg-[#fff7cc]" onClick={onEdit} type="button">{actionLabel}</button>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EstimatePanel({ category, services, products, total }: { category?: PublicVehicleCategory; services: SelectedService[]; products: SelectedProduct[]; total: number }) {
  const productCount = products.reduce((sum, line) => sum + line.quantity, 0);

  return (
     <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
       <div className="rounded-[1.5rem] bg-[#171717] p-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
        <div className="flex items-start justify-between gap-3">
          <div>
             <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#f4c400]">Live estimate</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">Your request</h2>
          </div>
           <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4c400]/15 text-[#f4c400]"><ClipboardCheck className="h-5 w-5" /></span>
        </div>
        <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Vehicle</span>
            <span className="font-bold text-white">{category?.name ?? "Not selected"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Services</span>
            <span className="font-bold text-white">{services.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Products</span>
            <span className="font-bold text-white">{productCount}</span>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-5">
           <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f4c400]">Estimated total</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">{formatCurrency(total)}</p>
        </div>
      </div>
       <div className="rounded-[1.5rem] border border-[#ead98a] bg-[#fff7cc] p-5">
        <div className="flex items-start gap-3">
           <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#a77f00]" />
          <div>
             <p className="text-sm font-bold text-[#292929]">No account needed</p>
             <p className="mt-1 text-sm leading-6 text-[#6f652f]">Your details are used only to send this request to the wash team. We do not show previous visits or other customer records.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function HiddenSubmissionFields({
  details,
  vehicleDetails,
  categoryId,
  serviceIds,
  productLines,
  idempotencyKey,
}: {
  details: CustomerDetails;
  vehicleDetails: VehicleDetails;
  categoryId: string;
  serviceIds: string[];
  productLines: CheckInProductLine[];
  idempotencyKey: string;
}) {
  return (
    <>
      <input name="firstName" type="hidden" value={details.firstName} />
      <input name="lastName" type="hidden" value={details.lastName} />
      <input name="mobileNumber" type="hidden" value={details.mobileNumber} />
      <input name="email" type="hidden" value={details.email} />
      <input name="vehicleCategoryId" type="hidden" value={categoryId} />
      <input name="plateNumber" type="hidden" value={vehicleDetails.plateNumber} />
      <input name="make" type="hidden" value={vehicleDetails.make} />
      <input name="model" type="hidden" value={vehicleDetails.model} />
      <input name="color" type="hidden" value={vehicleDetails.color} />
      <input name="serviceIds" type="hidden" value={JSON.stringify(serviceIds)} />
      <input name="productLines" type="hidden" value={JSON.stringify(productLines)} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    </>
  );
}

function SuccessScreen({ onReset, result }: { onReset: () => void; result: CheckInSuccessResult }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const vehicleDescription = [
    result.vehicleDetails.make,
    result.vehicleDetails.model,
    result.vehicleDetails.color,
    result.vehicleDetails.plateNumber,
  ].filter(Boolean).join(" · ");

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f1e7]">
      <header className="mx-auto flex min-h-[92px] w-full max-w-[1280px] items-center justify-between gap-4 border-b border-[#dfddd4] px-4 sm:px-6 lg:border-0 lg:px-10">
        <BrandMark />
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d7d4ca] bg-white/80 px-3.5 text-sm font-bold text-[#292929] shadow-sm transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc] hover:text-[#171717] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href="/">Back to home<ArrowRight className="h-4 w-4" /></Link>
      </header>
      <section className="mx-auto w-full max-w-[760px] px-4 py-12 sm:px-6 sm:py-20 lg:px-10">
        <div className="rounded-[1.75rem] border border-[#ead98a] bg-white p-6 text-center shadow-[0_20px_55px_rgba(0,0,0,0.08)] sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff7cc] text-[#a77f00]"><CheckCircle className="h-8 w-8" /></span>
          <p className="mt-7 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Request submitted</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#171717] outline-none sm:text-4xl" id="check-in-success-title" ref={headingRef} tabIndex={-1}>Your request has been submitted.</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#65635d]">Thanks, {result.customerName}. Please keep this check-in number for the counter team.</p>
          <div className="mt-7 rounded-2xl bg-[#171717] p-5 text-white sm:p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#f4c400]">Check-in number</p>
            <p className="mt-2 text-3xl font-bold tracking-[0.05em] sm:text-4xl">{result.transactionNumber}</p>
          </div>
          <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
             <div className="rounded-2xl border border-[#dfddd4] bg-[#f7f6f1] p-4">
               <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Vehicle</p>
               <p className="mt-2 font-bold text-[#292929]">{result.vehicleCategoryName}</p>
               {vehicleDescription && <p className="mt-1 text-sm text-[#706e67]">{vehicleDescription}</p>}
             </div>
             <div className="rounded-2xl border border-[#dfddd4] bg-[#f7f6f1] p-4">
               <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Estimated total</p>
               <p className="mt-2 font-bold text-[#292929]">{formatCurrency(result.total)}</p>
            </div>
          </div>
           <div className="mt-5 rounded-2xl border border-[#dfddd4] bg-white p-5 text-left">
             <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Selected services</p>
            <div className="mt-3 space-y-2">
              {result.services.map((service) => (
                 <div className="flex items-start justify-between gap-3 text-sm" key={`${service.name}-${service.lineTotal}`}><span className="min-w-0 break-words font-semibold text-[#4a4945]">{service.name}</span><span className="shrink-0 font-bold text-[#292929]">{formatCurrency(service.lineTotal)}</span></div>
              ))}
            </div>
            {result.products.length > 0 && (
              <>
                 <p className="mt-5 border-t border-[#e8e5dc] pt-4 text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Optional products</p>
                <div className="mt-3 space-y-2">
                  {result.products.map((product) => (
                     <div className="flex items-start justify-between gap-3 text-sm" key={`${product.name}-${product.quantity}`}><span className="min-w-0 break-words font-semibold text-[#4a4945]">{product.name} x{product.quantity}</span><span className="shrink-0 font-bold text-[#292929]">{formatCurrency(product.lineTotal)}</span></div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
             <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f4c400] px-6 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" onClick={onReset} type="button">New check-in<ArrowRight className="h-4 w-4" /></button>
             <Link className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d7d4ca] bg-white px-6 text-sm font-bold text-[#292929] transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href="/">Return home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckInWizardSession({ catalog, idempotencyKey, onReset }: { catalog: PublicCheckInCatalog; idempotencyKey: string; onReset: () => void }) {
  const [state, formAction, actionPending] = useActionState(submitPublicCheckInAction, initialCheckInActionState);
  const [isOffline, setIsOffline] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [details, setDetails] = useState<CustomerDetails>(initialCustomerDetails);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>(initialVehicleDetails);
  const [categoryId, setCategoryId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [stepNotice, setStepNotice] = useState("");
  const stepContentRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef<Step>(1);

  const category = catalog.vehicleCategories.find((candidate) => candidate.id === categoryId);
  const selectedServices: SelectedService[] = selectedServiceIds
    .map((id) => {
      const service = catalog.services.find((candidate) => candidate.id === id);
      const price = catalog.servicePrices.find((candidate) => candidate.serviceId === id && candidate.vehicleCategoryId === categoryId)?.price ?? null;
      return service ? { service, price } : null;
    })
    .filter((line): line is SelectedService => line !== null);
  const selectedProducts: SelectedProduct[] = catalog.shopProducts
    .map((product) => ({ product, quantity: productQuantities[product.id] ?? 0 }))
    .filter((line) => line.quantity > 0);
  const productLines: CheckInProductLine[] = selectedProducts.map(({ product, quantity }) => ({ inventoryItemId: product.id, quantity }));
  const serviceSubtotal = selectedServices.reduce((sum, line) => sum + (line.price ?? 0), 0);
  const productSubtotal = selectedProducts.reduce((sum, line) => sum + line.product.sellingPrice * line.quantity, 0);
  const total = serviceSubtotal + productSubtotal;
  const canSubmit = Boolean(categoryId && selectedServices.length > 0 && selectedServices.every((line) => line.price !== null));

  useEffect(() => {
    function updateNetworkStatus() {
      setIsOffline(!navigator.onLine);
    }

    updateNetworkStatus();
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  useEffect(() => {
    if (previousStepRef.current === step) {
      return;
    }

    previousStepRef.current = step;
    stepContentRef.current?.focus();
  }, [step]);

  function updateCustomerDetail(field: keyof CustomerDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function updateVehicleDetail(field: keyof VehicleDetails, value: string) {
    setVehicleDetails((current) => ({ ...current, [field]: value }));
  }

  function updateCategory(nextCategoryId: string) {
    const availableServiceIds = new Set(
      catalog.servicePrices
        .filter((price) => price.vehicleCategoryId === nextCategoryId)
        .map((price) => price.serviceId),
    );
    const retainedServiceIds = selectedServiceIds.filter((serviceId) => availableServiceIds.has(serviceId));

    setCategoryId(nextCategoryId);

    if (retainedServiceIds.length !== selectedServiceIds.length) {
      setSelectedServiceIds(retainedServiceIds);
      setStepNotice("Some selected services are not available for this vehicle category and were removed.");
    } else {
      setStepNotice("");
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
  }

  function setProductQuantity(productId: string, quantity: number) {
    setProductQuantities((current) => {
      const next = { ...current };

      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }

      return next;
    });
  }

  function continueToNextStep() {
    setStepNotice("");

    if (step === 1 && (!details.firstName.trim() || !details.lastName.trim() || !details.mobileNumber.trim())) {
      setStepNotice("Add your first name, last name, and mobile number to continue.");
      return;
    }

    if (step === 2 && !categoryId) {
      setStepNotice("Choose a vehicle category to continue.");
      return;
    }

    if (step === 3 && (selectedServices.length === 0 || selectedServices.some((line) => line.price === null))) {
      setStepNotice("Choose at least one service with an available price to continue.");
      return;
    }

    setStep((current) => Math.min(5, current + 1) as Step);
  }

  function goBack() {
    setStepNotice("");
    setStep((current) => Math.max(1, current - 1) as Step);
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < 5) {
      event.preventDefault();
      continueToNextStep();
    }
  }

  if (state.status === "success" && state.result) {
    return <SuccessScreen onReset={onReset} result={state.result} />;
  }

  return (
    <main className="min-h-screen bg-[#f5f1e7]">
      <header className="mx-auto flex min-h-[92px] w-full max-w-[1280px] items-center justify-between gap-4 border-b border-[#dfddd4] px-4 sm:px-6 lg:border-0 lg:px-10">
        <BrandMark />
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d7d4ca] bg-white/80 px-3.5 text-sm font-bold text-[#292929] shadow-sm transition-colors hover:border-[#c7a900] hover:bg-[#fff7cc] hover:text-[#171717] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40" href="/">Back to home<ArrowRight className="h-4 w-4" /></Link>
      </header>

      <section className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Public customer check-in</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.06em] text-[#171717] sm:text-5xl">Plan your visit in a few taps.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#65635d] sm:text-lg">Choose your vehicle, services, and any optional shop products. We will send a clear request to the wash team.</p>
        </div>

         <div className="mt-8">
           <StepIndicator currentStep={step} />
         </div>

         {isOffline && <div aria-live="polite" className="mt-5 rounded-xl border border-[#ead98a] bg-[#fff9d9] px-4 py-3 text-sm font-semibold leading-6 text-[#756000]">You are offline. Check-in is not submitted or saved on this device. Reconnect to continue.</div>}

         <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
           <form action={step === 5 ? formAction : undefined} className="rounded-[1.75rem] border border-[#dfddd4] bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.06)] sm:p-8" onSubmit={handleFormSubmit}>
            <HiddenSubmissionFields
              categoryId={categoryId}
              details={details}
              idempotencyKey={idempotencyKey}
              productLines={productLines}
              serviceIds={selectedServiceIds}
              vehicleDetails={vehicleDetails}
            />
            <ActionFeedback state={state} />
            <ValidationSummary state={state} />
            <div aria-labelledby="check-in-step-heading" className={state.status === "error" ? "mt-6" : ""} ref={stepContentRef} role="region" tabIndex={-1}>
              {step === 1 && <CustomerDetailsStep details={details} onChange={updateCustomerDetail} state={state} />}
              {step === 2 && <VehicleStep categories={catalog.vehicleCategories} details={vehicleDetails} onCategoryChange={updateCategory} onDetailChange={updateVehicleDetail} selectedCategoryId={categoryId} state={state} />}
              {step === 3 && <ServiceStep categoryId={categoryId} onToggle={toggleService} prices={catalog.servicePrices} selectedIds={selectedServiceIds} services={catalog.services} state={state} />}
              {step === 4 && <ProductStep onQuantityChange={setProductQuantity} products={catalog.shopProducts} quantities={productQuantities} state={state} />}
              {step === 5 && <ReviewStep category={category} details={details} onEdit={setStep} productSubtotal={productSubtotal} products={selectedProducts} serviceSubtotal={serviceSubtotal} services={selectedServices} total={total} vehicleDetails={vehicleDetails} />}
            </div>

             {stepNotice && <p aria-live="polite" className="mt-6 rounded-xl border border-[#ead98a] bg-[#fff9d9] px-4 py-3 text-sm font-semibold leading-6 text-[#756000]">{stepNotice}</p>}
             <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e8e5dc] pt-6 sm:flex-row sm:items-center sm:justify-between">
               <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-[#65635d] transition-colors hover:bg-[#f2f1eb] hover:text-[#292929] disabled:invisible" disabled={step === 1} onClick={goBack} type="button"><ChevronRight className="h-4 w-4 rotate-180" />Back</button>
               {step < 5 ? (
                  <button className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f4c400] px-6 text-base font-bold text-[#171717] shadow-[0_12px_25px_rgba(177,139,0,0.2)] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 sm:w-auto" onClick={continueToNextStep} type="button">Continue<ArrowRight className="h-5 w-5" /></button>
              ) : <SubmitButton disabled={!canSubmit || !idempotencyKey || isOffline} pending={actionPending} />}
            </div>
          </form>
          <EstimatePanel category={category} products={selectedProducts} services={selectedServices} total={total} />
        </div>
      </section>

       <footer className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 border-t border-[#dfddd4] px-4 py-7 text-xs text-[#89867d] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
         <p>Cool Car Centrale customer check-in</p>
        <p>No login required · Nothing is saved on this shared device</p>
      </footer>
    </main>
  );
}

export function CheckInWizard({ catalog, initialIdempotencyKey }: { catalog: PublicCheckInCatalog; initialIdempotencyKey: string }) {
  const [session, setSession] = useState({ instance: 0, idempotencyKey: initialIdempotencyKey });

  return (
    <CheckInWizardSession
      catalog={catalog}
      idempotencyKey={session.idempotencyKey}
      key={session.instance}
      onReset={() => setSession((current) => ({ instance: current.instance + 1, idempotencyKey: crypto.randomUUID() }))}
    />
  );
}
