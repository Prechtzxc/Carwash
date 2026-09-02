import { AdminModulePlaceholder } from "@/components/admin-module-placeholder";

export default function SalesPage() {
  return (
    <AdminModulePlaceholder
      description="A focused home for the sales view that will be driven by completed carwash transactions."
      eyebrow="Sales"
      icon="sales"
      nextPhase="Connect completed transaction records so this workspace can surface sales activity."
      title="Sales, when the work is complete."
    />
  );
}
