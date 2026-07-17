"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type PunchPointPhoto = {
  id: number;
  photo_url: string;
  original_filename: string;
  photo_type: string;
  caption: string | null;
  created_at: string;
};

export type PunchPoint = {
  id: number;
  inspection_job_id: number;
  tower_id: number;
  checklist_item_id: number;
  punch_no: string;
  title: string;
  description: string | null;
  severity: string | null;
  status: string;
  closure_remarks: string | null;
  tower_code: string | null;
  original_photos: PunchPointPhoto[];
  closure_photos: PunchPointPhoto[];
  created_at: string;
};

export function ReinspectionManagement() {
  const [punchPoints, setPunchPoints] = useState<PunchPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const data = await apiRequest<PunchPoint[]>("/punch-points");
      setPunchPoints(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Group by job
  const jobs = punchPoints.reduce((acc, pp) => {
    if (!acc[pp.inspection_job_id]) {
      acc[pp.inspection_job_id] = {
        job_id: pp.inspection_job_id,
        tower_code: pp.tower_code || "Unknown Tower",
        open_count: 0,
        ready_count: 0,
        closed_count: 0,
        items: []
      };
    }
    acc[pp.inspection_job_id].items.push(pp);
    if (pp.status === "OPEN" || pp.status === "REOPENED" || pp.status === "REJECTED_CLOSURE") {
      acc[pp.inspection_job_id].open_count++;
    } else if (pp.status === "READY_FOR_REINSPECTION") {
      acc[pp.inspection_job_id].ready_count++;
    } else if (pp.status === "CLOSED") {
      acc[pp.inspection_job_id].closed_count++;
    }
    return acc;
  }, {} as Record<number, any>);

  const jobList = Object.values(jobs);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-sm text-sm">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Reinspections</CardTitle>
          <CardDescription>Select a tower/job to view and address punch points.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : jobList.length === 0 ? (
            <div className="text-sm text-slate-500">No punch points found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-medium">Job ID</th>
                    <th className="py-2 px-3 font-medium">Tower Code</th>
                    <th className="py-2 px-3 font-medium text-center">Open/Action Req</th>
                    <th className="py-2 px-3 font-medium text-center">Ready for Review</th>
                    <th className="py-2 px-3 font-medium text-center">Closed</th>
                    <th className="py-2 px-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobList.map((job: any) => (
                    <tr key={job.job_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">JOB-{job.job_id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{job.tower_code}</td>
                      <td className="py-3 px-3 text-center">
                        {job.open_count > 0 ? (
                          <Badge className="bg-red-100 text-red-800 border-red-200">{job.open_count}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {job.ready_count > 0 ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">{job.ready_count}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {job.closed_count > 0 ? (
                          <Badge className="text-green-600 border-green-200 bg-green-50">{job.closed_count}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/admin/reinspections/${job.job_id}`}>
                          <Button variant="outline" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                            Open Reinspection
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
