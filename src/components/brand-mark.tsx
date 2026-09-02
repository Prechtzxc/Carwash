import Link from "next/link";

import { Droplets } from "@/components/icons";

type BrandMarkProps = {
  href?: string;
  tone?: "dark" | "light";
};

export function BrandMark({ href = "/", tone = "dark" }: BrandMarkProps) {
  const titleClassName = tone === "light" ? "text-white" : "text-[#10222e]";
  const captionClassName = tone === "light" ? "text-slate-400" : "text-[#6a7a80]";

  return (
    <Link aria-label="RinsePoint home" className="group inline-flex items-center gap-3" href={href}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[#0d9f91] text-white shadow-[0_8px_20px_rgba(13,159,145,0.22)] transition-transform duration-200 group-hover:-translate-y-0.5">
        <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full border border-white/20" />
        <Droplets className="relative h-5 w-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-[1.02rem] font-bold tracking-[-0.03em] ${titleClassName}`}>RinsePoint</span>
        <span className={`mt-1 text-[0.54rem] font-semibold uppercase tracking-[0.2em] ${captionClassName}`}>Carwash operations</span>
      </span>
    </Link>
  );
}
