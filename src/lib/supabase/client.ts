"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig, SUPABASE_CONFIGURATION_ERROR } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(SUPABASE_CONFIGURATION_ERROR);
  }

  browserClient = createBrowserClient<Database>(config.url, config.key);
  return browserClient;
}
