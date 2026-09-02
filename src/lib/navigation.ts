import type { AdminNavigationItem } from "@/types/navigation";

export const adminNavigation = [
  {
    label: "Sales",
    href: "/admin/sales",
    icon: "sales",
    description: "A future view of completed wash activity.",
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: "clients",
    description: "A future home for customer records.",
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: "inventory",
    description: "A future view of shop products and stock.",
  },
] as const satisfies readonly AdminNavigationItem[];
