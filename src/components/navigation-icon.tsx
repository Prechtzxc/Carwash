import { Boxes, ChartLine, LayoutDashboard, Users } from "@/components/icons";
import type { AdminNavigationIcon } from "@/types/navigation";

type NavigationIconProps = {
  name: AdminNavigationIcon;
  className?: string;
};

export function NavigationIcon({ name, className }: NavigationIconProps) {
  if (name === "dashboard") {
    return <LayoutDashboard className={className} />;
  }

  if (name === "sales") {
    return <ChartLine className={className} />;
  }

  if (name === "clients") {
    return <Users className={className} />;
  }

  return <Boxes className={className} />;
}
