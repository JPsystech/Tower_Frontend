import { EngineerJobList } from "@/components/engineer/engineer-job-list";

export default function EngineerJobsPage() {
  return (
    <div className="flex-1 space-y-2 p-2 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          My Inspections
        </h2>
      </div>
      <EngineerJobList />
    </div>
  );
}
