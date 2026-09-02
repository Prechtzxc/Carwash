"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  ArrowRight,
  CheckCircle,
  CircleDashed,
  Layers,
  ShieldCheck,
  Sparkles,
} from "@/components/icons";
import {
  initialCatalogActionState,
  saveServiceAction,
  saveServicePriceAction,
  saveVehicleCategoryAction,
  toggleServiceAction,
  toggleVehicleCategoryAction,
  type CatalogActionState,
} from "@/app/admin/(protected)/catalog/actions";
import type { ServiceDto, ServicePriceDto, VehicleCategoryDto } from "@/lib/catalog/data";
import type { AppRole } from "@/types/auth";
import { vehicleSizeLabels, vehicleSizes, type VehicleSize } from "@/types/catalog";

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#d7e5e0] bg-white px-3.5 text-sm text-[#18323c] shadow-sm outline-none transition-colors placeholder:text-[#9aa9aa] focus:border-[#0d8278] focus:ring-4 focus:ring-[#d7f1eb]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#607378]";

type CatalogManagerProps = {
  role: AppRole;
  categories: VehicleCategoryDto[];
  services: ServiceDto[];
  prices: ServicePriceDto[];
};

function ActionFeedback({ state }: { state: CatalogActionState }) {
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

function CompactSubmitButton({
  children,
  pendingLabel,
  tone = "primary",
}: {
  children: ReactNode;
  pendingLabel: string;
  tone?: "primary" | "quiet";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={
        tone === "primary"
          ? "min-h-9 rounded-lg bg-[#0d8278] px-3 text-xs font-bold text-white transition-colors hover:bg-[#096e67] disabled:cursor-not-allowed disabled:opacity-55"
          : "min-h-9 rounded-lg border border-[#d7e5e0] bg-white px-3 text-xs font-bold text-[#486168] transition-colors hover:border-[#a8cfc5] hover:text-[#0d8278] disabled:cursor-not-allowed disabled:opacity-55"
      }
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${
        active ? "bg-[#e1f6f0] text-[#0d8278]" : "bg-[#eef1f0] text-[#78878a]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#17a190]" : "bg-[#9aa7a6]"}`} />
      {active ? "Active" : "Inactive"}
    </span>
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

function StaffReadOnlyNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#ccebe3] bg-[#effaf7] p-4 text-sm leading-6 text-[#52706e]">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0d8278]" />
      <p>Staff access is read-only. An active admin can edit catalog settings and prices.</p>
    </div>
  );
}

function StatusToggle({ entity, id, active }: { entity: "category" | "service"; id: string; active: boolean }) {
  const action = entity === "category" ? toggleVehicleCategoryAction : toggleServiceAction;
  const [state, formAction] = useActionState(action, initialCatalogActionState);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={formAction}>
        <input name="id" type="hidden" value={id} />
        <input name="active" type="hidden" value={String(!active)} />
        <CompactSubmitButton pendingLabel="Updating..." tone="quiet">
          {active ? "Disable" : "Enable"}
        </CompactSubmitButton>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

function CategoryEditor({ category }: { category?: VehicleCategoryDto }) {
  const [state, formAction] = useActionState(saveVehicleCategoryAction, initialCatalogActionState);
  const prefix = category ? `category-${category.id}` : "new-category";
  const nameErrorId = `${prefix}-name-error`;
  const descriptionErrorId = `${prefix}-description-error`;
  const sortOrderErrorId = `${prefix}-sort-order-error`;

  return (
    <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#0d8278]">
            {category ? "Edit category" : "New category"}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10222e]">
            {category?.name ?? "Add a vehicle category"}
          </h3>
        </div>
        {category && (
          <div className="flex flex-col items-end gap-2">
            <StatusBadge active={category.active} />
            <StatusToggle entity="category" id={category.id} active={category.active} />
          </div>
        )}
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {category && <input name="id" type="hidden" value={category.id} />}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-name`}>Name</label>
            <input
              aria-describedby={state.fieldErrors.name ? nameErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors.name)}
              className={`${inputClass} mt-2`}
              defaultValue={category?.name ?? ""}
              id={`${prefix}-name`}
              maxLength={80}
              name="name"
              placeholder="e.g. Sedan"
              required
            />
            <FieldError id={nameErrorId} message={state.fieldErrors.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-sort-order`}>Sort order</label>
            <input
              aria-describedby={state.fieldErrors.sortOrder ? sortOrderErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors.sortOrder)}
              className={`${inputClass} mt-2`}
              defaultValue={category?.sort_order ?? 0}
              id={`${prefix}-sort-order`}
              inputMode="numeric"
              max={9999}
              min={0}
              name="sortOrder"
              required
              step={1}
              type="number"
            />
            <FieldError id={sortOrderErrorId} message={state.fieldErrors.sortOrder} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-description`}>Description</label>
            <textarea
              aria-describedby={state.fieldErrors.description ? descriptionErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors.description)}
              className={`${inputClass} mt-2 min-h-24 resize-y py-3`}
              defaultValue={category?.description ?? ""}
              id={`${prefix}-description`}
              maxLength={240}
              name="description"
              placeholder="Optional operator-facing description"
              rows={3}
            />
            <FieldError id={descriptionErrorId} message={state.fieldErrors.description} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-size-class`}>Default size</label>
            <select
              className={`${inputClass} mt-2`}
              defaultValue={category?.size_class ?? "small"}
              id={`${prefix}-size-class`}
              name="sizeClass"
            >
              {vehicleSizes.map((size) => (
                <option key={size} value={size}>{vehicleSizeLabels[size]}</option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-[#7b898c]">Used as the default price size for this category.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#edf2f0] pt-4">
          <SubmitButton>{category ? "Save category" : "Add category"}</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </article>
  );
}

function CategoryReadOnly({ category }: { category: VehicleCategoryDto }) {
  return (
    <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.03)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-[-0.025em] text-[#10222e]">{category.name}</h3>
            <StatusBadge active={category.active} />
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b7b7f]">{category.description || "No description provided."}</p>
        </div>
        <span className="rounded-lg bg-[#f3f7f5] px-3 py-2 text-xs font-bold text-[#607378]">
          {vehicleSizeLabels[category.size_class]} size
        </span>
      </div>
      <p className="mt-4 text-xs font-semibold text-[#899797]">Sort order {category.sort_order}</p>
    </article>
  );
}

function CategorySection({ categories, canManage }: { categories: VehicleCategoryDto[]; canManage: boolean }) {
  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="vehicle-categories">
      <SectionHeading
        count={categories.length}
        description="Keep the vehicle choices clear for operators and map each category to a default pricing size."
        index="01"
        title="Vehicle categories"
      />
      {!canManage && <div className="mt-5"><StaffReadOnlyNote /></div>}
      {canManage && (
        <div className="mt-5">
          <CategoryEditor />
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {categories.length > 0 ? (
          categories.map((category) => (
            canManage ? <CategoryEditor category={category} key={category.id} /> : <CategoryReadOnly category={category} key={category.id} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-6 text-sm leading-6 text-[#6b7b7f] lg:col-span-2">
            No vehicle categories are configured yet.
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceEditor({ service }: { service?: ServiceDto }) {
  const [state, formAction] = useActionState(saveServiceAction, initialCatalogActionState);
  const prefix = service ? `service-${service.id}` : "new-service";
  const nameErrorId = `${prefix}-name-error`;
  const descriptionErrorId = `${prefix}-description-error`;
  const sortOrderErrorId = `${prefix}-sort-order-error`;

  return (
    <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#0d8278]">
            {service ? "Edit service" : "New service"}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10222e]">
            {service?.name ?? "Add a wash or add-on"}
          </h3>
        </div>
        {service && (
          <div className="flex flex-col items-end gap-2">
            <StatusBadge active={service.active} />
            <StatusToggle entity="service" id={service.id} active={service.active} />
          </div>
        )}
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {service && <input name="id" type="hidden" value={service.id} />}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-name`}>Name</label>
            <input
              aria-describedby={state.fieldErrors.name ? nameErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors.name)}
              className={`${inputClass} mt-2`}
              defaultValue={service?.name ?? ""}
              id={`${prefix}-name`}
              maxLength={80}
              name="name"
              placeholder="e.g. Basic Wash"
              required
            />
            <FieldError id={nameErrorId} message={state.fieldErrors.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-sort-order`}>Sort order</label>
            <input
              aria-describedby={state.fieldErrors.sortOrder ? sortOrderErrorId : undefined}
              aria-invalid={Boolean(state.fieldErrors.sortOrder)}
              className={`${inputClass} mt-2`}
              defaultValue={service?.sort_order ?? 0}
              id={`${prefix}-sort-order`}
              inputMode="numeric"
              max={9999}
              min={0}
              name="sortOrder"
              required
              step={1}
              type="number"
            />
            <FieldError id={sortOrderErrorId} message={state.fieldErrors.sortOrder} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor={`${prefix}-description`}>Description</label>
          <textarea
            aria-describedby={state.fieldErrors.description ? descriptionErrorId : undefined}
            aria-invalid={Boolean(state.fieldErrors.description)}
            className={`${inputClass} mt-2 min-h-24 resize-y py-3`}
            defaultValue={service?.description ?? ""}
            id={`${prefix}-description`}
            maxLength={240}
            name="description"
            placeholder="Optional operator-facing description"
            rows={3}
          />
          <FieldError id={descriptionErrorId} message={state.fieldErrors.description} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#edf2f0] pt-4">
          <SubmitButton>{service ? "Save service" : "Add service"}</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </article>
  );
}

function ServiceReadOnly({ service }: { service: ServiceDto }) {
  return (
    <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 shadow-[0_12px_35px_rgba(35,73,70,0.03)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-[-0.025em] text-[#10222e]">{service.name}</h3>
            <StatusBadge active={service.active} />
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b7b7f]">{service.description || "No description provided."}</p>
        </div>
        <span className="rounded-lg bg-[#f3f7f5] px-3 py-2 text-xs font-bold text-[#607378]">Order {service.sort_order}</span>
      </div>
    </article>
  );
}

function ServiceSection({ services, canManage }: { services: ServiceDto[]; canManage: boolean }) {
  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="services">
      <SectionHeading
        count={services.length}
        description="Define the wash and add-on services that will later be offered to customers and operators."
        index="02"
        title="Services"
      />
      {!canManage && <div className="mt-5"><StaffReadOnlyNote /></div>}
      {canManage && (
        <div className="mt-5">
          <ServiceEditor />
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {services.length > 0 ? (
          services.map((service) => (
            canManage ? <ServiceEditor key={service.id} service={service} /> : <ServiceReadOnly key={service.id} service={service} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-6 text-sm leading-6 text-[#6b7b7f] lg:col-span-2">
            No services are configured yet. Add a service before setting prices.
          </div>
        )}
      </div>
    </section>
  );
}

function formatPrice(price: number) {
  const amount = Number(price);
  return Number.isFinite(amount) ? amount.toFixed(2) : "Unavailable";
}

function PriceCell({ serviceId, sizeClass, price, canManage }: { serviceId: string; sizeClass: VehicleSize; price?: ServicePriceDto; canManage: boolean }) {
  const [state, formAction] = useActionState(saveServicePriceAction, initialCatalogActionState);
  const prefix = `${serviceId}-${sizeClass}`;
  const priceErrorId = `${prefix}-price-error`;

  if (!canManage) {
    return (
      <div className="rounded-xl border border-[#e3ece8] bg-[#fbfdfc] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#607378]">{vehicleSizeLabels[sizeClass]}</p>
          {price && <StatusBadge active={price.active} />}
        </div>
        <p className="mt-5 text-xl font-bold tracking-[-0.03em] text-[#18323c]">{price ? formatPrice(price.price) : "Not set"}</p>
        <p className="mt-1 text-xs text-[#899797]">{price ? "Configured amount" : "No price configured"}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-[#e3ece8] bg-[#fbfdfc] p-4">
      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="sizeClass" type="hidden" value={sizeClass} />
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#607378]" htmlFor={`${prefix}-price`}>
          {vehicleSizeLabels[sizeClass]}
        </label>
        {price && <StatusBadge active={price.active} />}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          aria-describedby={state.fieldErrors.price ? priceErrorId : undefined}
          aria-invalid={Boolean(state.fieldErrors.price)}
          className={`${inputClass} min-w-0`}
          defaultValue={price ? formatPrice(price.price) : ""}
          id={`${prefix}-price`}
          inputMode="decimal"
          min={0}
          name="price"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <span className="shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-[#899797]">amount</span>
      </div>
      <FieldError id={priceErrorId} message={state.fieldErrors.price} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`${prefix}-active`}>Price status</label>
        <select className={`${inputClass} min-h-9 flex-1 px-2.5 text-xs`} defaultValue={String(price?.active ?? true)} id={`${prefix}-active`} name="active">
          <option value="true">Active price</option>
          <option value="false">Inactive price</option>
        </select>
        <CompactSubmitButton pendingLabel="Saving...">Save</CompactSubmitButton>
      </div>
      <div className="mt-2">
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}

function PricingSection({ services, prices, canManage }: { services: ServiceDto[]; prices: ServicePriceDto[]; canManage: boolean }) {
  function findPrice(serviceId: string, sizeClass: VehicleSize) {
    return prices.find((price) => price.service_id === serviceId && price.size_class === sizeClass);
  }

  return (
    <section className="rounded-[1.5rem] border border-[#dce8e4] bg-[#f8fbfa] p-5 sm:p-7" id="pricing">
      <SectionHeading
        count={prices.length}
        description="Set one amount per service and vehicle size. Empty cells are intentionally left unset until an admin configures them."
        index="03"
        title="Service pricing"
      />
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f0dfb8] bg-[#fff8e8] p-4 text-sm leading-6 text-[#796239]">
        <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-[#b88635]" />
        <p>Prices are stored by size class without assuming a currency or adding checkout behavior.</p>
      </div>
      {!canManage && <div className="mt-4"><StaffReadOnlyNote /></div>}
      <div className="mt-4 space-y-4">
        {services.length > 0 ? (
          services.map((service) => (
            <article className="rounded-2xl border border-[#dce8e4] bg-white p-5 sm:p-6" key={service.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold tracking-[-0.025em] text-[#10222e]">{service.name}</h3>
                    <StatusBadge active={service.active} />
                  </div>
                  <p className="mt-1 text-sm text-[#748387]">{service.description || "No description provided."}</p>
                </div>
                <span className="rounded-lg bg-[#f3f7f5] px-3 py-2 text-xs font-bold text-[#607378]">{prices.filter((price) => price.service_id === service.id).length}/4 set</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {vehicleSizes.map((sizeClass) => (
                  <PriceCell
                    canManage={canManage}
                    key={sizeClass}
                    price={findPrice(service.id, sizeClass)}
                    serviceId={service.id}
                    sizeClass={sizeClass}
                  />
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d4ce] bg-white p-6 text-sm leading-6 text-[#6b7b7f]">
            Add a service above to create its size-based pricing matrix.
          </div>
        )}
      </div>
    </section>
  );
}

export function CatalogManager({ categories, prices, role, services }: CatalogManagerProps) {
  const canManage = role === "admin";
  const activeCategories = categories.filter((category) => category.active).length;
  const activeServices = services.filter((service) => service.active).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">Configuration</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#10222e] sm:text-4xl">Catalog and pricing</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#64757a]">
            Shape the services and vehicle rules that will power future check-in and transaction flows. This workspace stores configuration only.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#dce8e4] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(35,73,70,0.04)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f5f1] text-[#0d8278]">
            {canManage ? <Sparkles className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#829196]">Access level</p>
            <p className="mt-1 text-sm font-bold text-[#28424d]">{canManage ? "Admin editing" : "Staff read-only"}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ccebe3] bg-[#e9f8f4] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#0d8278]">Active categories</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{activeCategories}</p>
          <p className="mt-1 text-xs text-[#52706e]">of {categories.length} configured</p>
        </div>
        <div className="rounded-2xl border border-[#d8e2f6] bg-[#f0f4ff] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#4966a4]">Active services</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{activeServices}</p>
          <p className="mt-1 text-xs text-[#65779c]">of {services.length} configured</p>
        </div>
        <div className="rounded-2xl border border-[#f1dfbd] bg-[#fff7e7] p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#ac7121]">Price points</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#10222e]">{prices.length}</p>
          <p className="mt-1 text-xs text-[#8d754f]">of {services.length * vehicleSizes.length} possible</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-[#102c38] p-6 text-white shadow-[0_18px_45px_rgba(16,44,56,0.12)] sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9cefe2]">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#8fe7da]">Configuration rules</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">Keep the catalog deliberate.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Disable records instead of deleting them, and leave prices unset until the operator has approved the amount.</p>
            </div>
          </div>
          <a className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-sm font-bold text-[#c6fff6] transition-colors hover:bg-white/15" href="#vehicle-categories">
            Start with categories
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <CategorySection canManage={canManage} categories={categories} />
      <ServiceSection canManage={canManage} services={services} />
      <PricingSection canManage={canManage} prices={prices} services={services} />

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#829196]">
        <CheckCircle className="h-4 w-4 text-[#0d9f91]" />
        Catalog configuration is protected by the admin access policy.
      </p>
    </div>
  );
}
