export type AdminNavigationIcon = "sales" | "clients" | "inventory";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: AdminNavigationIcon;
  description: string;
};
