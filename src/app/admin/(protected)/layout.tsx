import type { ReactNode } from "react";

import { AdminNavigation } from "@/components/admin-navigation";
import { AdminUserControl } from "@/components/admin-user-control";
import { BrandMark } from "@/components/brand-mark";
import { CircleDashed } from "@/components/icons";
import { requireAdminProfile } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdminProfile();

  return (
    <div className="min-h-screen bg-[#f4f8f7]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-white/8 bg-[#0d202c] lg:flex">
        <div className="px-7 py-7">
          <BrandMark tone="light" />
        </div>
        <div className="px-4">
          <p className="mb-3 px-3 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-slate-500">Workspace</p>
          <AdminNavigation variant="sidebar" />
        </div>
        <div className="mt-auto p-5">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#16453f] text-[#9cefe2]">
              <CircleDashed className="h-4 w-4" />
            </span>
            <div>
                <p className="text-xs font-semibold text-white">Phase 4 foundation</p>
                <p className="mt-1 text-[0.7rem] leading-5 text-slate-400">Inventory and catalog configuration</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-[#dce8e4] bg-white/80 px-4 sm:px-6 lg:px-10">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#829196]">Admin console</p>
            <p className="mt-1 text-sm font-semibold text-[#28424d]">Operations workspace</p>
          </div>
          <AdminUserControl fullName={profile.full_name} />
        </header>

        <div className="border-b border-[#dce8e4] bg-[#edf4f1] px-4 py-3 lg:hidden">
          <AdminNavigation variant="mobile" />
        </div>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
