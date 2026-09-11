import type { ReactNode } from "react";

import { AdminNavigation } from "@/components/admin-navigation";
import { AdminUserControl } from "@/components/admin-user-control";
import { BrandMark } from "@/components/brand-mark";
import { requireAdminProfile } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdminProfile();

  return (
    <div className="min-h-screen bg-[#f5f1e7]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col overflow-y-auto border-r border-[#3b3b3b] bg-[#242424] lg:flex print:hidden">
        <div className="border-b border-white/10 px-5 py-6">
          <BrandMark size="sidebar" tone="light" />
        </div>
        <div className="px-4 py-6">
          <AdminNavigation variant="sidebar" />
        </div>
        <div className="mt-auto border-t border-white/10 px-4 pb-5 pt-5">
          <AdminUserControl fullName={profile.full_name} variant="sidebar" />
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72 print:pl-0">
        <header className="flex min-h-[72px] items-center border-b border-[#ded8c9] bg-[#fffdf7]/95 px-4 py-1 sm:min-h-[82px] sm:px-6 sm:py-0 lg:hidden print:hidden">
          <BrandMark size="mobile" />
        </header>

        <div className="border-b border-[#3b3b3b] bg-[#171717] px-4 py-2 sm:py-3 lg:hidden print:hidden">
          <div className="space-y-2 sm:space-y-3">
            <AdminNavigation variant="mobile" />
            <AdminUserControl fullName={profile.full_name} variant="mobile" />
          </div>
        </div>

        <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8 print:max-w-none print:px-0 print:py-0">{children}</main>
      </div>
    </div>
  );
}
