"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  ArrowRight,
  CarFront,
  CheckCircle,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
} from "@/components/icons";
import {
  updateCustomerProfileAction,
  updateCustomerVehicleAction,
  type ClientActionState,
} from "@/app/admin/(protected)/clients/actions";
import { initialFormActionState } from "@/lib/form-action-state";
import type { ClientDetail } from "@/lib/clients/data";

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#dedbd1] bg-white px-3.5 text-sm text-[#292929] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#65635d]";

function formatCurrency(value: number) {
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "No completed visit";
  }

  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  });
}

function vehicleLabel(vehicle: ClientDetail["vehicles"][number]) {
  return [vehicle.make, vehicle.model, vehicle.vehicleCategoryName].filter(Boolean).join(" / ");
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-semibold text-[#b34646]" id={id}>{message}</p>;
}

function ActionFeedback({ state }: { state: ClientActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <div aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${state.status === "success" ? "border-[#ead98a] bg-[#fff7cc] text-[#756000]" : "border-[#f0d3c8] bg-[#fff4ef] text-[#9f4c47]"}`}>
      {state.message}
    </div>
  );
}

function FormButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-4 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-55" disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}

function SectionHeading({ description, eyebrow, icon, title }: { description: string; eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#dfddd4] pb-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]">{icon}</span>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#65635d]">{description}</p>
      </div>
    </div>
  );
}

function CustomerProfileForm({ customer }: { customer: ClientDetail["customer"] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateCustomerProfileAction, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input name="customerId" type="hidden" value={customer.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="client-first-name">First name</label>
          <input aria-describedby={state.fieldErrors.firstName ? "client-first-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors.firstName)} className={`${inputClass} mt-1.5`} defaultValue={customer.firstName} id="client-first-name" name="firstName" required />
          <FieldError id="client-first-name-error" message={state.fieldErrors.firstName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="client-last-name">Last name</label>
          <input aria-describedby={state.fieldErrors.lastName ? "client-last-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors.lastName)} className={`${inputClass} mt-1.5`} defaultValue={customer.lastName} id="client-last-name" name="lastName" required />
          <FieldError id="client-last-name-error" message={state.fieldErrors.lastName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="client-mobile">Mobile number</label>
          <input aria-describedby={state.fieldErrors.mobileNumber ? "client-mobile-error" : undefined} aria-invalid={Boolean(state.fieldErrors.mobileNumber)} className={`${inputClass} mt-1.5`} defaultValue={customer.mobileNumber} id="client-mobile" inputMode="tel" name="mobileNumber" required />
          <FieldError id="client-mobile-error" message={state.fieldErrors.mobileNumber} />
        </div>
        <div>
          <label className={labelClass} htmlFor="client-email">Email <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
          <input aria-describedby={state.fieldErrors.email ? "client-email-error" : undefined} aria-invalid={Boolean(state.fieldErrors.email)} className={`${inputClass} mt-1.5`} defaultValue={customer.email ?? ""} id="client-email" name="email" type="email" />
          <FieldError id="client-email-error" message={state.fieldErrors.email} />
        </div>
      </div>
      <ActionFeedback state={state} />
      <div className="flex flex-col gap-3 border-t border-[#e8e5dc] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-5 text-[#89867d]">This changes the current customer record only. Existing transaction snapshots remain unchanged.</p>
        <FormButton pendingLabel="Saving profile..."><CheckCircle className="h-4 w-4" />Save profile</FormButton>
      </div>
    </form>
  );
}

function VehicleForm({ customerId, vehicle, vehicleCategories }: { customerId: string; vehicle: ClientDetail["vehicles"][number]; vehicleCategories: ClientDetail["vehicleCategories"] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateCustomerVehicleAction, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="rounded-2xl border border-[#dfddd4] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.035)] sm:p-6">
      <input name="customerId" type="hidden" value={customerId} />
      <input name="vehicleId" type="hidden" value={vehicle.id} />
      <div className="flex flex-col gap-4 border-b border-[#e8e5dc] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f1eb] text-[#171717]"><CarFront className="h-5 w-5" /></span>
          <div>
            <h3 className="text-lg font-bold tracking-[-0.025em] text-[#292929]">{vehicleLabel(vehicle)}</h3>
            <p className="mt-1 text-sm text-[#65635d]">{vehicle.completedVisits} completed visit{vehicle.completedVisits === 1 ? "" : "s"} · Last visit {formatDateTime(vehicle.lastCompletedVisit)}</p>
          </div>
        </div>
        <span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold ${vehicle.vehicleCategoryActive ? "bg-[#fff7cc] text-[#756000]" : "bg-[#f2f1eb] text-[#6e6b64]"}`}>
          {vehicle.vehicleCategoryActive ? "Active category" : "Inactive category"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`vehicle-category-${vehicle.id}`}>Vehicle category</label>
          <select aria-describedby={state.fieldErrors.vehicleCategoryId ? `vehicle-category-${vehicle.id}-error` : undefined} aria-invalid={Boolean(state.fieldErrors.vehicleCategoryId)} className={`${inputClass} mt-1.5`} defaultValue={vehicle.vehicleCategoryId} id={`vehicle-category-${vehicle.id}`} name="vehicleCategoryId">
            {vehicleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.active ? "" : " (inactive)"}</option>)}
          </select>
          <FieldError id={`vehicle-category-${vehicle.id}-error`} message={state.fieldErrors.vehicleCategoryId} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`vehicle-plate-${vehicle.id}`}>Plate number <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
          <input aria-describedby={state.fieldErrors.plateNumber ? `vehicle-plate-${vehicle.id}-error` : undefined} aria-invalid={Boolean(state.fieldErrors.plateNumber)} className={`${inputClass} mt-1.5`} defaultValue={vehicle.plateNumber ?? ""} id={`vehicle-plate-${vehicle.id}`} name="plateNumber" />
          <FieldError id={`vehicle-plate-${vehicle.id}-error`} message={state.fieldErrors.plateNumber} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`vehicle-color-${vehicle.id}`}>Color <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
          <input aria-describedby={state.fieldErrors.color ? `vehicle-color-${vehicle.id}-error` : undefined} aria-invalid={Boolean(state.fieldErrors.color)} className={`${inputClass} mt-1.5`} defaultValue={vehicle.color ?? ""} id={`vehicle-color-${vehicle.id}`} name="color" />
          <FieldError id={`vehicle-color-${vehicle.id}-error`} message={state.fieldErrors.color} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`vehicle-make-${vehicle.id}`}>Make <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
          <input aria-describedby={state.fieldErrors.make ? `vehicle-make-${vehicle.id}-error` : undefined} aria-invalid={Boolean(state.fieldErrors.make)} className={`${inputClass} mt-1.5`} defaultValue={vehicle.make ?? ""} id={`vehicle-make-${vehicle.id}`} name="make" />
          <FieldError id={`vehicle-make-${vehicle.id}-error`} message={state.fieldErrors.make} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`vehicle-model-${vehicle.id}`}>Model <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
          <input aria-describedby={state.fieldErrors.model ? `vehicle-model-${vehicle.id}-error` : undefined} aria-invalid={Boolean(state.fieldErrors.model)} className={`${inputClass} mt-1.5`} defaultValue={vehicle.model ?? ""} id={`vehicle-model-${vehicle.id}`} name="model" />
          <FieldError id={`vehicle-model-${vehicle.id}-error`} message={state.fieldErrors.model} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <ActionFeedback state={state} />
        <div className="flex flex-col gap-3 border-t border-[#e8e5dc] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#89867d]">Updated current vehicle details do not rewrite completed visit snapshots.</p>
          <FormButton pendingLabel="Saving vehicle...">Save vehicle</FormButton>
        </div>
      </div>
    </form>
  );
}

function TransactionLines({ lines, emptyLabel }: { lines: ClientDetail["transactions"][number]["services"]; emptyLabel: string }) {
  if (lines.length === 0) {
    return <p className="text-sm text-[#9a978d]">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <div className="flex items-start justify-between gap-4 text-sm" key={`${line.name}-${index}`}>
          <p className="min-w-0 font-semibold text-[#4a4945]">{line.name}{line.quantity > 1 ? ` x${line.quantity}` : ""}</p>
          <p className="shrink-0 font-bold text-[#292929]">{formatCurrency(line.lineTotal)}</p>
        </div>
      ))}
    </div>
  );
}

function CompletedHistory({ transactions }: { transactions: ClientDetail["transactions"] }) {
  return (
    <div className="mt-6 space-y-4">
      {transactions.length > 0 ? transactions.map((transaction) => (
        <article className="rounded-2xl border border-[#dfddd4] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.035)] sm:p-6" key={transaction.id}>
          <div className="flex flex-col gap-4 border-b border-[#e8e5dc] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link className="inline-flex items-center gap-2 text-sm font-black tracking-[0.07em] text-[#a77f00] hover:text-[#756000]" href={`/admin/transactions/${transaction.id}`}>
                {transaction.transactionNumber}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-1 text-sm text-[#65635d]">Completed {formatDateTime(transaction.completedAt)}</p>
            </div>
            <p className="text-xl font-black tracking-[-0.03em] text-[#171717]">{formatCurrency(transaction.total)}</p>
          </div>

          <div className="mt-5 rounded-xl border border-[#e8e5dc] bg-[#f7f6f1] p-4">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Historical vehicle snapshot</p>
            <p className="mt-2 font-bold text-[#3f3f3f]">{[transaction.vehicle.categoryName, transaction.vehicle.make, transaction.vehicle.model].filter(Boolean).join(" / ")}</p>
            <p className="mt-1 text-sm text-[#65635d]">Plate {transaction.vehicle.plateNumber ?? "not provided"} · Color {transaction.vehicle.color ?? "not provided"}</p>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Services</p>
              <TransactionLines emptyLabel="No services recorded" lines={transaction.services} />
            </div>
            <div>
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#89867d]">Shop products</p>
              <TransactionLines emptyLabel="No shop products recorded" lines={transaction.products} />
            </div>
          </div>
        </article>
      )) : (
        <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7cc] text-[#a77f00]"><Clock className="h-5 w-5" /></span>
          <h3 className="mt-4 text-lg font-bold text-[#292929]">No completed visits yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65635d]">Pending and cancelled requests are not included in client activity or history.</p>
        </div>
      )}
    </div>
  );
}

export function AdminClientDetail({ detail }: { detail: ClientDetail }) {
  const { customer, summary } = detail;

  return (
    <div className="space-y-8">
      <header>
        <Link className="inline-flex items-center gap-1 text-sm font-bold text-[#a77f00] hover:text-[#756000]" href="/admin/clients"><ChevronRight className="h-4 w-4 rotate-180" />Back to clients</Link>
        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Client profile</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">{customer.firstName} {customer.lastName}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#65635d]">
              <span className="font-semibold text-[#3f3f3f]">{customer.mobileNumber}</span>
              <span>{customer.email ?? "No email provided"}</span>
              <span>Client since {formatDate(customer.createdAt)}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#fff7cc] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#756000] lg:self-auto"><Users className="h-3.5 w-3.5" />Protected admin record</span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.35rem] border border-[#dfddd4] bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Completed visits</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#171717]">{summary.completedVisits}</p>
          <p className="mt-2 text-xs leading-5 text-[#65635d]">Completed transactions only</p>
        </div>
        <div className="rounded-[1.35rem] border border-[#dfddd4] bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">Last visit</p>
          <p className="mt-3 text-xl font-black tracking-[-0.04em] text-[#171717]">{summary.lastCompletedVisit ? formatDate(summary.lastCompletedVisit) : "Not yet"}</p>
          <p className="mt-2 text-xs leading-5 text-[#65635d]">Based on `completed_at`</p>
        </div>
        <div className="rounded-[1.35rem] border border-[#ead98a] bg-[#fff7cc] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#756000]">Completed spend</p>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-[#171717]">{formatCurrency(summary.totalTransactionAmount)}</p>
          <p className="mt-2 text-xs leading-5 text-[#6f652f]">Historical transaction totals</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
        <SectionHeading description="Update the current customer record used for future visits. Historical transaction names and contact details remain snapshots." eyebrow="Current record" icon={<Users className="h-4 w-4" />} title="Customer details" />
        <CustomerProfileForm customer={customer} />
      </section>

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <SectionHeading description="Keep current vehicle details accurate for the next check-in without rewriting prior visit snapshots." eyebrow="Current records" icon={<CarFront className="h-4 w-4" />} title="Vehicles" />
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] sm:self-auto">{detail.vehicles.length} vehicle{detail.vehicles.length === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-6 space-y-4">
          {detail.vehicles.length > 0 ? detail.vehicles.map((vehicle) => <VehicleForm customerId={customer.id} key={vehicle.id} vehicle={vehicle} vehicleCategories={detail.vehicleCategories} />) : <p className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-6 text-sm leading-6 text-[#65635d]">No current vehicles are recorded for this customer.</p>}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7">
        <SectionHeading description="Completed transactions are shown from their stored historical snapshots. Current profile or vehicle edits cannot alter this record." eyebrow="Immutable history" icon={<Sparkles className="h-4 w-4" />} title="Completed visits" />
        <CompletedHistory transactions={detail.transactions} />
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#89867d]"><CheckCircle className="h-4 w-4 text-[#a77f00]" />Only completed transactions contribute to client visit frequency and spend.</p>
    </div>
  );
}
