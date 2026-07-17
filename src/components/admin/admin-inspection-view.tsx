"use client";

import { useEffect, useState } from "react";
import { apiRequest, getApiBaseUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

function PhotoViewer({ responseId }: { responseId: number }) {
  const [photos, setPhotos] = useState<any[]>([]);
  
  useEffect(() => {
    apiRequest(`/inspection-responses/${responseId}/photos`)
      .then(d => setPhotos(d as any[]))
      .catch(console.error);
  }, [responseId]);

  if (photos.length === 0) return <div className="text-xs text-slate-400 mt-2">No photos uploaded.</div>;

  return (
    <div className="mt-4 p-2 border border-slate-200 rounded-sm bg-slate-50">
      <h5 className="text-sm font-semibold mb-2 text-slate-700">Photos ({photos.length})</h5>
      <div className="flex flex-wrap gap-2">
        {photos.map(p => (
          <div key={p.id} className="w-24 h-24 bg-slate-200 rounded-sm overflow-hidden border border-slate-300">
            <img src={p.photo_url.startsWith('http') ? p.photo_url : `${getApiBaseUrl()}${p.photo_url}`} alt="Uploaded" className="object-cover w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminInspectionView({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<number, any>>({});
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const j = await apiRequest<any>(`/inspection-jobs/${jobId}`);
      setJob(j);
      
      if (j.status !== "ASSIGNED" && j.status !== "NOT_STARTED") {
        const cycles = await apiRequest<any[]>(`/inspection-cycles?inspection_job_id=${jobId}`);
        if (cycles.length > 0) {
          const c = cycles[0];
          setCycle(c);
          loadChecklist(j.checklist_template_id, c.id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setError("Failed to load job details.");
      setLoading(false);
    }
  };

  const loadChecklist = async (templateId: number, cycleId: number) => {
    try {
      const [tpl, secs, itms, resps] = await Promise.all<any>([
        apiRequest(`/checklist-templates/${templateId}`),
        apiRequest(`/checklist-sections?template_id=${templateId}`),
        apiRequest(`/checklist-items?template_id=${templateId}`),
        apiRequest(`/inspection-responses?inspection_cycle_id=${cycleId}`),
      ]);
      setTemplate(tpl as any);
      setSections((secs as any[]).sort((a: any, b: any) => a.section_order - b.section_order));
      setItems((itms as any[]).sort((a: any, b: any) => a.item_order - b.item_order));
      
      const respMap: Record<number, any> = {};
      (resps as any[]).forEach((r: any) => {
        respMap[r.checklist_item_id] = r;
      });
      setResponses(respMap);
      setLoading(false);
    } catch (err) {
      setError("Failed to load checklist structure.");
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error || !job) return <div className="text-rose-600">{error || "Job not found"}</div>;

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Job #{job.id} - {job.tower?.tower_name}</h2>
          <p className="text-slate-500">Project: {job.project?.project_name}</p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-800">{job.status}</Badge>
      </div>

      {!cycle ? (
        <div className="rounded-sm border border-slate-200 bg-white p-2 text-center shadow-sm">
          <p className="text-slate-500">Inspection cycle has not been started yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-sm border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">{template?.template_name}</h3>
            <p className="text-sm text-slate-500">Cycle No: {cycle.cycle_no} | Started: {new Date(cycle.started_at).toLocaleString()}</p>
          </div>

          <div className="space-y-8">
            {sections.map(sec => {
              const secItems = items.filter(i => i.checklist_section_id === sec.id);
              return (
                <div key={sec.id} className="rounded-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-2 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800">{sec.section_name}</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {secItems.map(item => {
                      const r = responses[item.id];
                      return (
                        <div key={item.id} className="p-2 sm:p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-slate-800">{item.item_text}</p>
                            {item.is_photo_required && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                Photo Required (Min: {item.min_photos})
                              </Badge>
                            )}
                          </div>
                          
                          {r ? (
                            <div className="bg-slate-50 p-2 rounded-sm border border-slate-200 text-sm">
                              <p><strong>Status:</strong> {r.answer_status}</p>
                              {r.measurement_value && <p><strong>Measurement:</strong> {r.measurement_value} {item.measurement_unit}</p>}
                              {r.severity && <p><strong>Severity:</strong> {r.severity}</p>}
                              {r.remarks && <p><strong>Remarks:</strong> {r.remarks}</p>}
                              <PhotoViewer responseId={r.id} />
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500 italic">No response submitted.</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
