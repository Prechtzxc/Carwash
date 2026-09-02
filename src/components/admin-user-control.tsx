"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LogOut } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/types/auth";

type AdminUserControlProps = {
  fullName: string | null;
  role: AppRole;
};

export function AdminUserControl({ fullName, role }: AdminUserControlProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = fullName?.trim() || "Admin user";

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setError(null);
    setIsLoggingOut(true);

    try {
      const { error: signOutError } = await createClient().auth.signOut();

      if (signOutError) {
        setError("We could not sign you out. Please try again.");
        return;
      }

      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("We could not sign you out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="max-w-24 text-right sm:max-w-40">
        <p className="truncate text-xs font-bold text-[#28424d]">{displayName}</p>
        <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#829196]">{role}</p>
      </div>
      <button
        aria-label="Log out"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dce8e4] bg-white px-3 text-xs font-bold text-[#486168] transition-colors hover:border-[#b8d5ce] hover:bg-[#f7fbfa] hover:text-[#10222e] disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5"
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">{isLoggingOut ? "Signing out..." : "Logout"}</span>
      </button>
      {error && <span aria-live="polite" className="sr-only">{error}</span>}
    </div>
  );
}
