"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "@/components/icons";
import { NavigationIcon } from "@/components/navigation-icon";
import { adminNavigation } from "@/lib/navigation";

type AdminNavigationProps = {
  variant: "mobile" | "sidebar";
};

export function AdminNavigation({ variant }: AdminNavigationProps) {
  const currentPath = usePathname() ?? "";
  const isMobile = variant === "mobile";

  return (
    <nav aria-label="Admin modules" className={isMobile ? "overflow-x-auto" : undefined}>
      <ul className={isMobile ? "flex min-w-max gap-2" : "space-y-1"}>
        {adminNavigation.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  isMobile
                    ? isActive
                       ? "bg-[#171717] text-white shadow-[0_5px_14px_rgba(0,0,0,0.16)]"
                       : "bg-white text-[#5d5a54] ring-1 ring-[#dfddd4] hover:bg-[#fffdf2] hover:text-[#171717]"
                     : isActive
                       ? "bg-white/10 text-white shadow-[inset_3px_0_0_#f4c400]"
                       : "text-slate-300 hover:bg-white/7 hover:text-white"
                }`}
                href={item.href}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isMobile
                       ? isActive
                         ? "bg-[#f4c400] text-[#171717]"
                         : "bg-[#fff7cc] text-[#756000]"
                       : isActive
                         ? "bg-[#f4c400] text-[#171717]"
                         : "bg-white/6 text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  <NavigationIcon className="h-[18px] w-[18px]" name={item.icon} />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
                {!isMobile && (
                  <ChevronRight className="ml-auto h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
