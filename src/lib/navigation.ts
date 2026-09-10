import type { AdminNavigationItem } from "@/types/navigation";

export const adminNavigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "dashboard",
    description: "Incoming check-ins and customer activity.",
  },
  {
    label: "Sales",
    href: "/admin/sales",
    icon: "sales",
    description: "Review completed wash activity.",
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: "clients",
    description: "View customer records and visit history.",
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: "inventory",
    description: "Track items, stock movements, and minimum levels.",
  },
] as const satisfies readonly AdminNavigationItem[];
