import type { ReactNode } from "react";

import { AdminNavigation } from "@/components/admin-navigation";
import { AdminUserControl } from "@/components/admin-user-control";
import { BrandMark } from "@/components/brand-mark";
import { CircleDashed } from "@/components/icons";
import { requireAdminProfile } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdminProfile();

  return (
    <div className="min-h-screen bg-[#f7f6f1]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-white/8 bg-[#111111] lg:flex print:hidden">
        <div className="px-7 py-7">
          <BrandMark tone="light" />
        </div>
        <div className="px-4">
           <p className="mb-3 px-3 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-slate-500">Workspace</p>
          <AdminNavigation variant="sidebar" />
        </div>
        <div className="mt-auto p-5">
           <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
             <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4a3d00] text-[#f4c400]">
               <CircleDashed className="h-4 w-4" />
             </span>
             <div>
                 <p className="text-xs font-semibold text-white">Operations settings</p>
                 <p className="mt-1 text-[0.7rem] leading-5 text-slate-400">Inventory and catalog configuration</p>
             </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72 print:pl-0">
         <header className="flex min-h-[92px] items-center justify-between gap-4 border-b border-[#dfddd4] bg-white/90 px-4 sm:px-6 lg:px-10 print:hidden">
           <div className="flex min-w-0 items-center gap-4">
             <div className="lg:hidden"><BrandMark /></div>
             <div className="hidden lg:block">
               <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#89867d]">Admin console</p>
               <p className="mt-1 text-sm font-semibold text-[#292929]">Operations workspace</p>
             </div>
           </div>
          <AdminUserControl fullName={profile.full_name} />
        </header>

        <div className="border-b border-[#dfddd4] bg-[#f1f0eb] px-4 py-3 lg:hidden print:hidden">
          <AdminNavigation variant="mobile" />
        </div>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10 print:max-w-none print:px-0 print:py-0">{children}</main>
      </div>
    </div>
  );
}
