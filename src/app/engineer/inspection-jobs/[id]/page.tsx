import { InspectionExecution } from "@/components/engineer/inspection-execution";

export default async function InspectionExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="flex-1 space-y-2 p-2 pt-6">
      <InspectionExecution jobId={resolvedParams.id} />
    </div>
  );
}
