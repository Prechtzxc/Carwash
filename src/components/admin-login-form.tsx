"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowRight, ShieldCheck } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIGURATION_ERROR } from "@/lib/supabase/config";

type AdminLoginFormProps = {
  initialError?: "configuration" | "unauthorized";
  returnTo: string;
};

function getInitialErrorMessage(error: AdminLoginFormProps["initialError"]) {
  if (error === "configuration") {
    return "Supabase is not configured yet. Add the required environment variables and restart the app.";
  }

  if (error === "unauthorized") {
    return "Please sign in with the active admin account.";
  }

  return null;
}

export function AdminLoginForm({ initialError, returnTo }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => getInitialErrorMessage(initialError));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormIncomplete = email.trim() === "" || password === "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("The email or password is incorrect.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message === SUPABASE_CONFIGURATION_ERROR) {
        setError("Supabase is not configured yet. Add the required environment variables and restart the app.");
      } else {
        setError("We could not sign you in right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-bold text-[#292929]" htmlFor="email">Email</label>
        <input
          autoComplete="username"
          className="mt-2 min-h-13 w-full rounded-xl border border-[#d7d4ca] bg-white px-4 text-sm text-[#171717] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-bold text-[#292929]" htmlFor="password">Password</label>
        </div>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-13 w-full rounded-xl border border-[#d7d4ca] bg-white px-4 text-sm text-[#171717] shadow-sm outline-none transition-colors placeholder:text-[#9a978d] focus:border-[#c7a900] focus:ring-4 focus:ring-[#fff0a8]"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
          type="password"
          value={password}
        />
      </div>

      {error && (
        <p aria-live="polite" className="rounded-xl border border-[#f0d3c8] bg-[#fff4ef] px-4 py-3 text-sm leading-6 text-[#a44f3d]">
          {error}
        </p>
      )}

      <button
        className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#f4c400] px-5 text-sm font-bold text-[#171717] shadow-[0_10px_22px_rgba(177,139,0,0.2)] transition-colors hover:bg-[#ffe45e] focus-visible:ring-4 focus-visible:ring-[#f4c400]/40 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || isFormIncomplete}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
        {!isSubmitting && <ArrowRight className="h-4 w-4" />}
      </button>

      <div className="flex items-start gap-3 rounded-xl bg-[#f2f1eb] p-4 text-xs leading-5 text-[#706e67]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#a77f00]" />
        <p>Admin access is provisioned by the system owner. There is no public registration.</p>
      </div>
    </form>
  );
}
