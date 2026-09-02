export function getSafeReturnPath(value: string | undefined) {
  if (!value || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }

  if (value !== "/admin" && !value.startsWith("/admin/")) {
    return "/admin";
  }

  return value;
}
