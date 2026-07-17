"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function EngineerJobList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    apiRequest<any[]>("/engineer/inspection-jobs").then(setJobs).catch(console.error);
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <div key={job.id} className="rounded-sm border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">{job.tower?.tower_name}</h3>
              <p className="text-sm text-slate-500">{job.tower?.tower_code}</p>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700">{job.status}</Badge>
          </div>
          <div className="mb-6 space-y-1 text-sm text-slate-600">
            <p><strong>Project:</strong> {job.project?.project_name}</p>
            <p><strong>Job Type:</strong> {job.job_type.replace("_", " ")}</p>
            <p><strong>Assigned:</strong> {new Date(job.created_at).toLocaleDateString()}</p>
          </div>
          <Button 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => router.push(`/engineer/inspection-jobs/${job.id}`)}
          >
            {job.status === "ASSIGNED" ? "Open Job" : "Resume Inspection"}
          </Button>
        </div>
      ))}
      {jobs.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-500">
          You have no assigned inspection jobs.
        </div>
      )}
    </div>
  );
}
