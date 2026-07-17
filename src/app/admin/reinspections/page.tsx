import { AppShell } from "@/components/layout/app-shell";
import { ReinspectionManagement } from "@/components/admin/reinspection-management";

export default function ReinspectionsPage() {
  return (
    <AppShell title="Reinspections">
      <ReinspectionManagement />
    </AppShell>
  );
}
