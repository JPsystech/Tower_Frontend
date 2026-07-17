import { InspectionJobDetail } from "@/components/admin/inspection-job-detail";

export default async function InspectionJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <InspectionJobDetail jobId={Number(resolvedParams.id)} />;
}
