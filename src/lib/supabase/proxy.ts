import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const adminLoginPath = "/admin/login";

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function redirectToLogin(request: NextRequest, response: NextResponse, error: "configuration" | "unauthorized") {
  const loginUrl = new URL(adminLoginPath, request.url);
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set("next", returnTo);
  loginUrl.searchParams.set("error", error);

  const redirectResponse = NextResponse.redirect(loginUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  for (const headerName of ["cache-control", "expires", "pragma"]) {
    const headerValue = response.headers.get(headerName);

    if (headerValue) {
      redirectResponse.headers.set(headerName, headerValue);
    }
  }

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedPath = isAdminPath(pathname) && pathname !== adminLoginPath;
  const config = getSupabaseConfig();

  if (!config) {
    if (isProtectedPath) {
      return redirectToLogin(request, NextResponse.next(), "configuration");
    }

    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(config.url, config.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, options, value }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value);
          });
        },
      },
    });

    const { data } = await supabase.auth.getClaims();

    if (isProtectedPath && !data?.claims?.sub) {
      return redirectToLogin(request, supabaseResponse, "unauthorized");
    }
  } catch {
    if (isProtectedPath) {
      return redirectToLogin(request, supabaseResponse, "configuration");
    }
  }

  return supabaseResponse;
}
