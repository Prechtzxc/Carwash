"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LogOut } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

type AdminUserControlProps = {
  fullName: string | null;
  variant?: "mobile" | "sidebar";
};

export function AdminUserControl({ fullName, variant = "sidebar" }: AdminUserControlProps) {
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

  const isSidebar = variant === "sidebar";

  return (
    <div className={isSidebar ? "space-y-3" : "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#4a4a4a] bg-[#2d2d2d] p-3"}>
      <div className={isSidebar ? "min-w-0" : "min-w-0 flex-1"}>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#f4c400]">Signed in</p>
        <p className="mt-1 truncate text-sm font-bold text-white">{displayName}</p>
      </div>
      <button
        aria-label="Log out"
        className={isSidebar
          ? "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-4 text-sm font-bold text-[#171717] shadow-[0_8px_18px_rgba(244,196,0,0.16)] transition-colors hover:bg-[#ffe45e] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#242424] disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-3.5 text-xs font-bold text-[#171717] shadow-[0_6px_14px_rgba(244,196,0,0.14)] transition-colors hover:bg-[#ffe45e] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2d2d2d] disabled:cursor-not-allowed disabled:opacity-60"}
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
      </button>
      {error && <p aria-live="polite" className={isSidebar ? "text-xs font-semibold text-[#ffb7a9]" : "basis-full text-xs font-semibold text-[#ffb7a9]"} role="alert">{error}</p>}
    </div>
  );
}
