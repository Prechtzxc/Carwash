"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LogOut } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

type AdminUserControlProps = {
  fullName: string | null;
};

export function AdminUserControl({ fullName }: AdminUserControlProps) {
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
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <div className="max-w-24 text-right sm:max-w-40">
         <p className="truncate text-xs font-bold text-[#292929]">{displayName}</p>
      </div>
      <button
        aria-label="Log out"
         className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfddd4] bg-white px-3 text-xs font-bold text-[#4a4945] transition-colors hover:border-[#c7a900] hover:bg-[#fffdf2] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5"
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">{isLoggingOut ? "Signing out..." : "Logout"}</span>
      </button>
      {error && <p aria-live="polite" className="basis-full text-right text-xs font-semibold text-[#b34646] sm:basis-auto sm:max-w-56" role="alert">{error}</p>}
    </div>
  );
}
