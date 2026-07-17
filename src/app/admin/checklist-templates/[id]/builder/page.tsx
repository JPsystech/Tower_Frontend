import { ChecklistBuilder } from "@/components/admin/checklist-builder";

export default async function ChecklistBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ChecklistBuilder templateId={resolvedParams.id} />;
}
