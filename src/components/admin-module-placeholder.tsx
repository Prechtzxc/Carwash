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
  sales: {
    icon: "text-[#0d8278]",
    iconSurface: "bg-[#dff6f0] ring-[#c7ebe3]",
  },
  clients: {
    icon: "text-[#4966a4]",
    iconSurface: "bg-[#e6edff] ring-[#d5e0ff]",
  },
  inventory: {
    icon: "text-[#ac7121]",
    iconSurface: "bg-[#fff0d4] ring-[#f5dfb6]",
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
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d8278]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[#10222e] sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#64757a]">{description}</p>
        </div>
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 ${styles.iconSurface}`}>
          <NavigationIcon className={`h-8 w-8 ${styles.icon}`} name={icon} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#dce8e4] bg-white p-6 shadow-[0_12px_35px_rgba(35,73,70,0.05)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7f4] text-[#0d8278]">
            <CircleDashed className="h-5 w-5" />
          </div>
          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#829196]">Workspace reserved</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#10222e]">The foundation is in place.</h2>
          <p className="mt-3 text-sm leading-6 text-[#6c7b80]">Live {eyebrow.toLowerCase()} records will appear here once the backend phase is connected.</p>
        </div>

        <div className="rounded-2xl border border-[#dce8e4] bg-[#102c38] p-6 text-white shadow-[0_12px_35px_rgba(16,44,56,0.12)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#a8eee2]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8fc9c0]">Phase 2 status</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">Placeholder ready to extend.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">This screen is intentionally free of business data, calculations, and actions for now.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#b9d4ce] bg-[#edf8f5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0d8278] shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#0d8278]">Next phase</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#4f6d6c]">{nextPhase}</p>
          </div>
        </div>
        <span className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 text-xs font-bold text-[#0d8278] shadow-sm sm:self-auto">
          Foundation only
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </section>
    </div>
  );
}
