export type PublicCheckInUrlConfig = {
  url: string | null;
  error: string | null;
};

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function getPublicCheckInUrl(): PublicCheckInUrlConfig {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return {
      url: null,
      error: "Set NEXT_PUBLIC_APP_URL before displaying a customer QR code.",
    };
  }

  let appUrl: URL;

  try {
    appUrl = new URL(configuredUrl);
  } catch {
    return {
      url: null,
      error: "NEXT_PUBLIC_APP_URL must be an absolute http(s) URL.",
    };
  }

  if (!["http:", "https:"].includes(appUrl.protocol) || appUrl.username || appUrl.password) {
    return {
      url: null,
      error: "NEXT_PUBLIC_APP_URL must be an absolute http(s) URL without credentials.",
    };
  }

  if (process.env.NODE_ENV === "production" && localHosts.has(appUrl.hostname)) {
    return {
      url: null,
      error: "NEXT_PUBLIC_APP_URL points to a local host. Set it to the deployed production domain.",
    };
  }

  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    return {
      url: null,
      error: "NEXT_PUBLIC_APP_URL must use HTTPS in production.",
    };
  }

  appUrl.pathname = "/check-in";
  appUrl.search = "";
  appUrl.hash = "";

  return { url: appUrl.toString(), error: null };
}
