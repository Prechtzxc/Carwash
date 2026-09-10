import { ArrowUpRight, CircleDashed, ClipboardCheck, Layers } from "@/components/icons";
import { NavigationIcon } from "@/components/navigation-icon";
import type { AdminNavigationIcon } from "@/types/navigation";

type AdminModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: AdminNavigationIcon;
  nextPhase: string;
};

const moduleStyles: Record<AdminNavigationIcon, { icon: string; iconSurface: string }> = {
  dashboard: {
    icon: "text-[#a77f00]",
    iconSurface: "bg-[#fff7cc] ring-[#ead98a]",
  },
  sales: {
    icon: "text-[#a77f00]",
    iconSurface: "bg-[#fff7cc] ring-[#ead98a]",
  },
  clients: {
    icon: "text-[#3f3f3f]",
    iconSurface: "bg-[#efeee8] ring-[#d7d4ca]",
  },
  inventory: {
    icon: "text-[#756000]",
    iconSurface: "bg-[#fff9d9] ring-[#ead98a]",
  },
};

export function AdminModulePlaceholder({
  description,
  eyebrow,
  icon,
  nextPhase,
  title,
}: AdminModulePlaceholderProps) {
  const styles = moduleStyles[icon];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#a77f00]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[#171717] sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#65635d]">{description}</p>
        </div>
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 ${styles.iconSurface}`}>
          <NavigationIcon className={`h-8 w-8 ${styles.icon}`} name={icon} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#dfddd4] bg-white p-6 shadow-[0_12px_35px_rgba(0,0,0,0.05)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7cc] text-[#a77f00]">
            <CircleDashed className="h-5 w-5" />
          </div>
          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#89867d]">Status</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#171717]">The page is ready.</h2>
          <p className="mt-3 text-sm leading-6 text-[#706e67]">Live {eyebrow.toLowerCase()} records will appear here when available.</p>
        </div>

        <div className="rounded-2xl border border-[#171717] bg-[#171717] p-6 text-white shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4c400]/15 text-[#f4c400]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f4c400]">Status</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">No records yet.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Records and actions will appear here when they are available.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#cfcac0] bg-[#fffdf2] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a77f00] shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a77f00]">Details</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#65635d]">{nextPhase}</p>
          </div>
        </div>
        <span className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 text-xs font-bold text-[#a77f00] shadow-sm sm:self-auto">
          Details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </section>
    </div>
  );
}
