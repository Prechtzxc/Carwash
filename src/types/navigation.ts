export type AdminNavigationIcon = "dashboard" | "sales" | "clients" | "inventory";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: AdminNavigationIcon;
  description: string;
};
