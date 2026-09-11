"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { saveStaffAction, toggleStaffAction, type StaffActionState } from "@/app/admin/(protected)/sales/staff/actions";
import { ArrowRight, CheckCircle, ChevronRight, Users } from "@/components/icons";
import { initialFormActionState } from "@/lib/form-action-state";
import type { AdminStaff, AdminStaffData } from "@/lib/staff/data";

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#dedbd1] bg-white px-3.5 text-sm text-[#292929] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]";
const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#65635d]";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleDateString("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  });
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${active ? "bg-[#fff7cc] text-[#756000]" : "bg-[#eef0eb] text-[#78766f]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#d4a900]" : "bg-[#9a978d]"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ActionFeedback({ state }: { state: StaffActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p aria-live="polite" className={`text-xs font-semibold ${state.status === "success" ? "text-[#756000]" : "text-[#b34646]"}`} role={state.status === "error" ? "alert" : undefined}>
      {state.message}
    </p>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-semibold text-[#b34646]" id={id}>{message}</p>;
}

function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-4 text-sm font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto" disabled={pending} type="submit">
      {pending ? pendingLabel : children}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function ToggleButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="min-h-10 rounded-lg bg-[#f4c400] px-3 text-xs font-bold text-[#171717] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-55" disabled={pending} type="submit">
      {pending ? "Updating..." : active ? "Disable" : "Enable"}
    </button>
  );
}

function StaffEditor({ onCancel, staff }: { onCancel?: () => void; staff?: AdminStaff }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveStaffAction, initialFormActionState);
  const [name, setName] = useState(staff?.name ?? "");
  const [mobileNumber, setMobileNumber] = useState(staff?.mobile_number ?? "");

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  const editing = Boolean(staff);

  return (
    <section className="rounded-[1.5rem] border border-[#ead98a] bg-[#fff9d9] p-4 sm:p-7">
      <div className="flex items-start gap-3 border-b border-[#ead98a] pb-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#a77f00]"><Users className="h-4 w-4" /></span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">{editing ? "Edit staff record" : "New staff record"}</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">{editing ? "Update staff details" : "Add a staff member"}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f652f]">Staff records are used for service assignments only. They do not create login accounts.</p>
        </div>
      </div>

      <form action={formAction} className="mt-5 space-y-4 sm:mt-6">
        {staff && <input name="id" type="hidden" value={staff.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="staff-name">Name</label>
            <input aria-describedby={state.fieldErrors.name ? "staff-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors.name)} className={inputClass} id="staff-name" name="name" onChange={(event) => setName(event.target.value)} required value={name} />
            <FieldError id="staff-name-error" message={state.fieldErrors.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor="staff-mobile">Mobile <span className="font-normal normal-case tracking-normal text-[#9a978d]">(optional)</span></label>
            <input aria-describedby={state.fieldErrors.mobileNumber ? "staff-mobile-error" : undefined} aria-invalid={Boolean(state.fieldErrors.mobileNumber)} className={inputClass} id="staff-mobile" inputMode="tel" name="mobileNumber" onChange={(event) => setMobileNumber(event.target.value)} value={mobileNumber} />
            <FieldError id="staff-mobile-error" message={state.fieldErrors.mobileNumber} />
          </div>
        </div>

        <ActionFeedback state={state} />
        <div className="flex flex-col gap-3 border-t border-[#ead98a] pt-4 sm:flex-row sm:justify-end">
          {editing && <button className="min-h-11 w-full rounded-xl border border-[#d7d4ca] bg-white px-4 text-sm font-bold text-[#4a4945] transition-colors hover:border-[#c7a900] sm:w-auto" onClick={onCancel} type="button">Cancel</button>}
          <SubmitButton pendingLabel={editing ? "Saving changes..." : "Adding staff..."}>{editing ? "Save changes" : "Add staff member"}</SubmitButton>
        </div>
      </form>
    </section>
  );
}

function StaffStatusToggle({ staff }: { staff: AdminStaff }) {
  const router = useRouter();
  const [state, formAction] = useActionState(toggleStaffAction, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={formAction}>
        <input name="id" type="hidden" value={staff.id} />
        <input name="active" type="hidden" value={String(!staff.active)} />
        <ToggleButton active={staff.active} />
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

function StaffRow({ staff, editing, onEdit }: { staff: AdminStaff; editing: boolean; onEdit: () => void }) {
  return (
    <article className={`rounded-2xl border bg-white p-4 sm:p-5 ${editing ? "border-[#d4b900] ring-2 ring-[#fff0a8]" : "border-[#dfddd4]"}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-bold text-[#292929]">{staff.name}</h3>
            <ActiveBadge active={staff.active} />
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-[#65635d] sm:flex-row sm:gap-4">
            <span>{staff.mobile_number ?? "No mobile number"}</span>
            <span className="text-xs text-[#89867d]">Added {formatDateTime(staff.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-[#e8e5dc] pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:border-t-0 sm:pt-0">
          <button className="min-h-10 rounded-lg border border-[#d7d4ca] bg-white px-3 text-xs font-bold text-[#4a4945] transition-colors hover:border-[#c7a900] hover:text-[#a77f00]" onClick={onEdit} type="button">{editing ? "Editing" : "Edit"}</button>
          <StaffStatusToggle staff={staff} />
        </div>
      </div>
    </article>
  );
}

export function AdminStaffManager({ staff }: AdminStaffData) {
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const editingStaff = staff.find((member) => member.id === editingStaffId);
  const activeCount = staff.filter((member) => member.active).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <Link className="inline-flex min-h-10 items-center gap-1 rounded-lg px-1 text-sm font-bold text-[#a77f00] hover:text-[#756000]" href="/admin/sales"><ChevronRight className="h-4 w-4 rotate-180" />Back to Sales</Link>
        <div className="mt-4 flex flex-col gap-4 sm:mt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">Staff records</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">Keep service assignments current.</h1>
            <p className="mt-3 text-sm leading-6 text-[#65635d] sm:text-base sm:leading-7">Manage the business staff list used when assigning completed service work. Disabling a member keeps their historical assignments and earnings intact.</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff7cc] text-[#a77f00] ring-1 ring-[#ead98a] sm:h-16 sm:w-16"><Users className="h-7 w-7 sm:h-8 sm:w-8" /></div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#ead98a] bg-[#fff9d9] p-4 sm:p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#756000]">Active staff</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#171717]">{activeCount}</p>
          <p className="mt-1 text-xs text-[#6f652f]">Available for new assignments</p>
        </div>
        <div className="rounded-2xl border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#89867d]">All records</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#171717]">{staff.length}</p>
          <p className="mt-1 text-xs text-[#65635d]">Inactive records are retained for history</p>
        </div>
      </section>

      <StaffEditor key={editingStaff?.id ?? "new"} onCancel={() => setEditingStaffId(null)} staff={editingStaff} />

      <section className="rounded-[1.5rem] border border-[#dfddd4] bg-[#f7f6f1] p-4 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[#dfddd4] pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]"><CheckCircle className="h-4 w-4" /></span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Assignment pool</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">Staff members</h2>
              <p className="mt-1 text-sm leading-6 text-[#65635d]">Only active members appear as new assignment choices. There is no delete action so completed history remains connected.</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5f5d57] sm:self-auto">{staff.length} {staff.length === 1 ? "record" : "records"}</span>
        </div>

        <div className="mt-5 space-y-3">
          {staff.length > 0 ? staff.map((member) => (
            <StaffRow editing={member.id === editingStaffId} key={member.id} onEdit={() => setEditingStaffId(member.id === editingStaffId ? null : member.id)} staff={member} />
          )) : (
            <div className="rounded-2xl border border-dashed border-[#cfcac0] bg-white p-7 text-sm leading-6 text-[#65635d]">No staff records yet. Add the first staff member above.</div>
          )}
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#89867d]"><CheckCircle className="h-4 w-4 text-[#a77f00]" />Staff records are private business data and are not customer login accounts.</p>
    </div>
  );
}
