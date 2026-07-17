import { AppShell } from "@/components/layout/app-shell";
import { ReinspectionScreen } from "@/components/admin/reinspection-screen";

export default async function JobReinspectionPage({ params }: { params: Promise<{ job_id: string }> }) {
  const resolvedParams = await params;
  return (
    <AppShell title="Reinspection Detail">
      <ReinspectionScreen jobId={resolvedParams.job_id} />
    </AppShell>
  );
}
