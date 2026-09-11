import { AdminStaffManager } from "@/components/admin-staff-manager";
import { getAdminStaffData } from "@/lib/staff/data";

export default async function StaffPage() {
  const data = await getAdminStaffData();

  return <AdminStaffManager {...data} />;
}
