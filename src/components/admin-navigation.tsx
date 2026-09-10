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
    <nav aria-label="Admin modules" className={isMobile ? "overflow-x-auto pb-1" : undefined}>
      <ul className={isMobile ? "flex min-w-max gap-2" : "space-y-1"}>
        {adminNavigation.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 focus-visible:ring-offset-2 ${
                  isMobile
                    ? isActive
                      ? "bg-[#f4c400] text-[#171717] shadow-[0_8px_18px_rgba(244,196,0,0.18)]"
                      : "bg-[#2d2d2d] text-[#f1f1f1] ring-1 ring-[#4a4a4a] hover:bg-[#3a3a3a] hover:text-white hover:ring-[#f4c400]/50"
                    : isActive
                      ? "bg-[#f4c400] text-[#171717] shadow-[0_8px_18px_rgba(244,196,0,0.16)]"
                      : "text-[#e2e2e2] hover:bg-[#343434] hover:text-white"
                }`}
                href={item.href}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isMobile
                      ? isActive
                        ? "bg-[#171717]/15 text-[#171717]"
                        : "bg-[#fff7cc] text-[#756000]"
                      : isActive
                        ? "bg-[#171717]/15 text-[#171717]"
                        : "bg-[#3a3a3a] text-[#f4c400] group-hover:bg-[#4a4a4a] group-hover:text-[#ffe67a]"
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
