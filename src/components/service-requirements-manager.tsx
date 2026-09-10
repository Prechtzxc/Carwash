"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { ArrowRight, CheckCircle, CircleDashed, Droplets } from "@/components/icons";
import {
  removeServiceInventoryRequirementAction,
  saveServiceInventoryRequirementAction,
  type InventoryActionState,
} from "@/app/admin/(protected)/inventory/actions";
import { initialFormActionState } from "@/lib/form-action-state";
import type {
  InventoryItemDto,
  InventoryRecipeData,
  ServiceInventoryRequirementDto,
} from "@/lib/inventory/data";

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#dedbd1] bg-white px-3.5 text-sm text-[#292929] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#65635d]";

function ActionFeedback({ state }: { state: InventoryActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={`text-xs font-semibold ${state.status === "success" ? "text-[#756000]" : "text-[#b34646]"}`}
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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-4 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-9 rounded-lg border border-[#efd5d0] bg-white px-3 text-xs font-bold text-[#aa5a51] transition-colors hover:border-[#dca9a0] hover:bg-[#fff8f6] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
      type="submit"
    >
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}

function RemoveRequirementForm({ id }: { id: string }) {
  const [state, formAction] = useActionState(removeServiceInventoryRequirementAction, initialFormActionState);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={formAction}>
        <input name="id" type="hidden" value={id} />
        <RemoveButton />
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${active ? "bg-[#fff7cc] text-[#756000]" : "bg-[#eef0eb] text-[#78766f]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#d4a900]" : "bg-[#9a978d]"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RequirementEditor({
  services,
  consumables,
  requirement,
}: {
  services: InventoryRecipeData["services"];
  consumables: InventoryItemDto[];
  requirement?: ServiceInventoryRequirementDto;
}) {
  const [state, formAction] = useActionState(saveServiceInventoryRequirementAction, initialFormActionState);
  const prefix = requirement ? `requirement-${requirement.id}` : "new-requirement";
  const serviceErrorId = `${prefix}-service-error`;
  const itemErrorId = `${prefix}-item-error`;
  const quantityErrorId = `${prefix}-quantity-error`;
  const fieldErrors = state?.fieldErrors ?? {};
  const selectableServices = services.filter((service) => service.active || service.id === requirement?.service_id);
  const selectableConsumables = consumables.filter((item) => item.active || item.id === requirement?.inventory_item_id);

  return (
    <article className="rounded-2xl border border-[#dfddd4] bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#a77f00]">
            {requirement ? "Edit recipe line" : "New recipe line"}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#171717]">
            {requirement ? "Adjust service usage" : "Add a consumable requirement"}
          </h3>
        </div>
        {requirement && <span className="rounded-full bg-[#f2f1eb] px-3 py-1.5 text-xs font-bold text-[#5f5d57]">Existing requirement</span>}
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {requirement && <input name="id" type="hidden" value={requirement.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${prefix}-service`}>Service</label>
            <select
              aria-describedby={fieldErrors.serviceId ? serviceErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.serviceId)}
              className={`${inputClass} mt-2`}
              defaultValue={requirement?.service_id ?? ""}
              id={`${prefix}-service`}
              name="serviceId"
              required
            >
              <option disabled value="">Select a service</option>
              {selectableServices.map((service) => (
                <option key={service.id} value={service.id}>{service.name}{service.active ? "" : " (inactive)"}</option>
              ))}
            </select>
            <FieldError id={serviceErrorId} message={fieldErrors.serviceId} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${prefix}-item`}>Consumable</label>
            <select
              aria-describedby={fieldErrors.inventoryItemId ? itemErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.inventoryItemId)}
              className={`${inputClass} mt-2`}
              defaultValue={requirement?.inventory_item_id ?? ""}
              id={`${prefix}-item`}
              name="inventoryItemId"
              required
            >
              <option disabled value="">Select a consumable</option>
              {selectableConsumables.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.unit}{item.active ? "" : " (inactive)"}
                </option>
              ))}
            </select>
            <FieldError id={itemErrorId} message={fieldErrors.inventoryItemId} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor={`${prefix}-quantity`}>Amount required per service</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              aria-describedby={fieldErrors.quantityRequired ? quantityErrorId : undefined}
              aria-invalid={Boolean(fieldErrors.quantityRequired)}
              className={`${inputClass} min-w-0`}
              defaultValue={requirement?.quantity_required ?? ""}
              id={`${prefix}-quantity`}
              inputMode="decimal"
              min={0.001}
              name="quantityRequired"
              placeholder="0.000"
              required
              step="0.001"
              type="number"
            />
             <span className="shrink-0 rounded-lg bg-[#f2f1eb] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#5f5d57]">Item unit</span>
          </div>
           <p className="mt-2 text-xs leading-5 text-[#817e75]">The amount is stored in the selected consumable&apos;s base unit, so recipes cannot mix incompatible units.</p>
          <FieldError id={quantityErrorId} message={fieldErrors.quantityRequired} />
        </div>

       <div className="flex flex-wrap items-center gap-3 border-t border-[#e8e5dc] pt-4">
          <SubmitButton>{requirement ? "Save requirement" : "Add requirement"}</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>

      {requirement && (
        <div className="mt-3 border-t border-[#e8e5dc] pt-3">
          <RemoveRequirementForm id={requirement.id} />
        </div>
      )}
    </article>
  );
}

function RequirementsSection({
  services,
  consumables,
  requirements,
}: InventoryRecipeData) {
  return (
    <div className="mt-5 space-y-4">
      {services.length > 0 ? services.map((service) => {
        const serviceRequirements = requirements.filter((requirement) => requirement.service_id === service.id);

        return (
          <article className="rounded-2xl border border-[#dfddd4] bg-white p-5 sm:p-6" key={service.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold tracking-[-0.025em] text-[#171717]">{service.name}</h3>
                  <ActiveBadge active={service.active} />
                </div>
                <p className="mt-1 text-sm text-[#706e67]">{service.description || "No description provided."}</p>
              </div>
              <span className="rounded-lg bg-[#f2f1eb] px-3 py-2 text-xs font-bold text-[#65635d]">
                {serviceRequirements.length} {serviceRequirements.length === 1 ? "ingredient" : "ingredients"}
              </span>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {serviceRequirements.length > 0 ? serviceRequirements.map((requirement) => (
                <RequirementEditor
                  consumables={consumables}
                  key={requirement.id}
                  requirement={requirement}
                  services={services}
                />
              )) : (
                <p className="rounded-xl border border-dashed border-[#cfcac0] bg-[#fffdf2] p-5 text-sm leading-6 text-[#65635d] lg:col-span-2">
                  No consumables configured for this service yet.
                </p>
              )}
            </div>
          </article>
        );
      }) : (
        <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-6 text-sm leading-6 text-[#65635d]">
          Add a service above before configuring its consumable requirements.
        </div>
      )}
    </div>
  );
}

export function ServiceRequirementsManager({ services, consumables, requirements }: InventoryRecipeData) {
  const activeConsumables = consumables.filter((item) => item.active);

  return (
    <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-5 sm:p-7" id="service-requirements">
      <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-xs font-black text-[#a77f00]">
            04
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#171717]">Service consumables</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#65635d]">Define the internal recipe for each service without deducting stock yet. The selected item supplies the recipe unit.</p>
          </div>
        </div>
        <span className="self-start rounded-full bg-[#f1f6f4] px-3 py-1.5 text-xs font-bold text-[#5d7475] sm:self-auto">
          {requirements.length} {requirements.length === 1 ? "requirement" : "requirements"}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#cfe4ef] bg-[#f0f8fc] p-4 text-sm leading-6 text-[#4e7181]">
        <Droplets className="mt-0.5 h-5 w-5 shrink-0 text-[#2c90a8]" />
        <p>Only inventory items marked as consumables belong in service recipes. Shop products stay separate and are not selected here.</p>
      </div>

      {activeConsumables.length === 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f0dfb8] bg-[#fff8e8] p-4 text-sm leading-6 text-[#796239]">
          <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-[#b88635]" />
          <p>Add and enable at least one consumable in Inventory before adding a new recipe line.</p>
        </div>
      )}

      <div className="mt-5">
        <RequirementEditor
          consumables={activeConsumables}
          services={services.filter((service) => service.active)}
        />
      </div>

      <RequirementsSection consumables={consumables} requirements={requirements} services={services} />

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#89867d]">
        <CheckCircle className="h-4 w-4 text-[#a77f00]" />
        Recipe configuration is protected by the active-admin policy.
      </p>
    </section>
  );
}
