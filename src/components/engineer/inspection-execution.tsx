"use client";

import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api";

function PhotoUploader({ responseId, maxPhotos, onUploadComplete, isReadOnly }: { responseId: number, maxPhotos?: number, onUploadComplete: () => void, isReadOnly: boolean }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [responseId]);

  const loadPhotos = async () => {
    try {
      const data = await apiRequest(`/inspection-responses/${responseId}/photos`);
      setPhotos(data as any[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (maxPhotos && photos.length >= maxPhotos) {
      alert(`Maximum of ${maxPhotos} photos allowed.`);
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("photo_type", "OVERALL");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${getApiBaseUrl()}/inspection-responses/${responseId}/photos`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Upload failed");
      }
      await loadPhotos();
      onUploadComplete();
    } catch (err: any) {
      alert(err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (photoId: number) => {
    try {
      await apiRequest(`/inspection-responses/photos/${photoId}`, { method: "DELETE" });
      await loadPhotos();
      onUploadComplete();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  if (loading) return <div className="text-xs text-slate-400">Loading photos...</div>;

  return (
    <div className="mt-4 p-2 border border-slate-200 rounded-sm bg-slate-50">
      <h5 className="text-sm font-semibold mb-2 text-slate-700">Photos ({photos.length}{maxPhotos ? ` / ${maxPhotos}` : ""})</h5>
      <div className="flex flex-wrap gap-2 mb-4">
        {photos.map(p => (
          <div key={p.id} className="relative group w-24 h-24 bg-slate-200 rounded-sm overflow-hidden border border-slate-300">
            <img src={p.photo_url.startsWith('http') ? p.photo_url : `${getApiBaseUrl()}${p.photo_url}`} alt="Uploaded" className="object-cover w-full h-full" />
            {!isReadOnly && (
              <button 
                onClick={() => handleDelete(p.id)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >✕</button>
            )}
          </div>
        ))}
        {photos.length === 0 && <div className="text-xs text-slate-400 py-4">No photos uploaded.</div>}
      </div>
      {!isReadOnly && (!maxPhotos || photos.length < maxPhotos) && (
        <div>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" ref={fileInputRef} onChange={handleUpload} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="text-xs">
            + Upload Photo
          </Button>
        </div>
      )}
    </div>
  );
}

export function InspectionExecution({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<number, any>>({});
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [readiness, setReadiness] = useState<any>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const j = await apiRequest<any>(`/engineer/inspection-jobs/${jobId}`);
      setJob(j);
      
      if (j.status !== "ASSIGNED") {
        let cId;
        if (j.status === "SUBMITTED") {
           // We need cycle ID, just fetch from job? No, we need to fetch cycle.
           // Since we don't have it directly in JobRead, we can fetch readiness? 
           // Better yet, in real world we'd get cycle from job. For now we will hit /inspection-jobs/id/start to get the current cycle if IN_PROGRESS, but if SUBMITTED it might fail? 
           // Wait, we can fetch all cycles for job. Since phase 6 didn't add an endpoint, we can just hit start which returns the existing cycle! 
           // Let's modify handleStart logic.
        }
        try {
          const startedCycle = await apiRequest<any>(`/inspection-jobs/${jobId}/start`, { method: "POST", body: JSON.stringify({}) });
          setCycle(startedCycle);
          cId = startedCycle.id;
        } catch (e: any) {
          // If submitted, it might throw if start logic prevents it, but Phase 6 start logic just returns existing cycle!
        }
        if (cId) {
          loadChecklist(j.checklist_template_id, cId);
          checkReadiness(cId);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError("Failed to load job.");
      setLoading(false);
    }
  };

  const checkReadiness = async (cycleId: number) => {
    try {
      const res = await apiRequest<any>(`/inspection-cycles/${cycleId}/submit-readiness`);
      setReadiness(res);
    } catch(e) {}
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

  const handleStart = async () => {
    try {
      const c = await apiRequest<any>(`/inspection-jobs/${jobId}/start`, { method: "POST", body: JSON.stringify({}) });
      setCycle(c);
      loadChecklist(job.checklist_template_id, c.id);
    } catch (err) {
      setError("Failed to start inspection.");
    }
  };

  const handleResponseChange = (itemId: number, field: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSaveDraft = async () => {
    setError("");
    setSuccess("");
    
    const payload = items.map(item => {
      const r = responses[item.id] || {};
      if (!r.answer_status) return null;
      return {
        checklist_section_id: item.checklist_section_id,
        checklist_item_id: item.id,
        answer_status: r.answer_status || "NA",
        answer_value: r.answer_value || null,
        measurement_value: r.measurement_value || null,
        remarks: r.remarks || null,
        severity: r.severity || null,
        inspection_cycle_id: cycle.id,
        inspection_job_id: parseInt(jobId),
        tower_id: job.tower_id,
        checklist_template_id: template.id
      };
    }).filter(Boolean);

    try {
      await apiRequest("/inspection-responses", { method: "POST", body: JSON.stringify(payload) });
      setSuccess("Draft saved successfully!");
      await loadChecklist(template.id, cycle.id);
      checkReadiness(cycle.id);
    } catch (err: any) {
      setError(err.message || "Failed to save draft. Check required fields.");
    }
  };

  const handleSubmitFinal = async () => {
    if (!confirm("Are you sure you want to final submit? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/inspection-cycles/${cycle.id}/submit`, { method: "POST", body: JSON.stringify({}) });
      setSuccess("Inspection submitted successfully!");
      setJob((prev: any) => ({ ...prev, status: "SUBMITTED" }));
      setCycle((prev: any) => ({ ...prev, status: "SUBMITTED" }));
      setReadiness(null);
    } catch (err: any) {
      setError(err.message || "Failed to submit.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div className="text-rose-600">{error}</div>;

  const isReadOnly = job.status === "SUBMITTED";

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Job #{job.id} - {job.tower?.tower_name}</h2>
          <p className="text-slate-500">Project: {job.project?.project_name}</p>
        </div>
        <Badge className={isReadOnly ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}>
          {job.status}
        </Badge>
      </div>

      {error && <div className="rounded-sm bg-rose-50 p-2 text-sm text-rose-600 font-medium">{error}</div>}
      {success && <div className="rounded-sm bg-emerald-50 p-2 text-sm text-emerald-600 font-medium">{success}</div>}

      {!cycle ? (
        <div className="rounded-sm border border-slate-200 bg-white p-2 text-center shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Ready to begin inspection?</h3>
          <p className="mb-6 text-slate-500">Ensure you are at the site location before starting the cycle.</p>
          <Button size="lg" onClick={handleStart} className="bg-indigo-600 hover:bg-indigo-700">
            Start Inspection
          </Button>
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
                      const r = responses[item.id] || { answer_status: "" };
                      const isFail = r.answer_status === "FAIL";
                      
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
                          
                          <div className="flex gap-2">
                            {["PASS", "FAIL", "NA"].map(status => (
                              <Button
                                key={status}
                                type="button"
                                disabled={isReadOnly}
                                className={r.answer_status === status ? 
                                  (status === "PASS" ? "bg-emerald-600 text-white hover:bg-emerald-700" : 
                                   status === "FAIL" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-600 text-white hover:bg-slate-700") 
                                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50"}
                                onClick={() => handleResponseChange(item.id, "answer_status", status)}
                              >
                                {status === "PASS" ? "OK" : status === "FAIL" ? "Not OK" : "NA"}
                              </Button>
                            ))}
                          </div>

                          {item.answer_type === "MEASUREMENT" && (
                            <div className="w-full sm:w-1/2">
                              <label className="text-xs font-medium text-slate-500 uppercase">Measurement Value ({item.measurement_unit})</label>
                              <input
                                type="text"
                                disabled={isReadOnly}
                                className="w-full mt-1 rounded-sm border border-slate-200 p-2 text-sm disabled:bg-slate-100"
                                placeholder={`Enter value in ${item.measurement_unit}`}
                                value={r.measurement_value || ""}
                                onChange={(e) => handleResponseChange(item.id, "measurement_value", e.target.value)}
                              />
                            </div>
                          )}

                          <div className="grid gap-2 sm:grid-cols-2">
                            {isFail && (
                              <div>
                                <label className="text-xs font-medium text-rose-500 uppercase">Severity *</label>
                                <select
                                  disabled={isReadOnly}
                                  className="w-full mt-1 rounded-sm border border-slate-200 p-2 text-sm disabled:bg-slate-100"
                                  value={r.severity || ""}
                                  onChange={(e) => handleResponseChange(item.id, "severity", e.target.value)}
                                >
                                  <option value="">Select Severity</option>
                                  <option value="MINOR">MINOR</option>
                                  <option value="MAJOR">MAJOR</option>
                                  <option value="CRITICAL">CRITICAL</option>
                                </select>
                              </div>
                            )}
                            <div className={isFail ? "" : "sm:col-span-2"}>
                              <label className={`text-xs font-medium uppercase ${isFail ? "text-rose-500" : "text-slate-500"}`}>
                                Remarks {isFail && "*"}
                              </label>
                              <input
                                type="text"
                                disabled={isReadOnly}
                                className="w-full mt-1 rounded-sm border border-slate-200 p-2 text-sm disabled:bg-slate-100"
                                placeholder="Add remarks..."
                                value={r.remarks || ""}
                                onChange={(e) => handleResponseChange(item.id, "remarks", e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Photos Section */}
                          {r.id ? (
                            <PhotoUploader 
                              responseId={r.id} 
                              maxPhotos={item.max_photos} 
                              isReadOnly={isReadOnly}
                              onUploadComplete={() => checkReadiness(cycle.id)} 
                            />
                          ) : (
                            <div className="mt-4 p-2 border border-slate-200 border-dashed rounded-sm bg-slate-50 text-center text-sm text-slate-500">
                              Save draft to enable photo uploads for this item.
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!isReadOnly && readiness && (
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-3 shadow-sm">
              <h4 className="font-semibold text-amber-800 mb-2">Submit Readiness</h4>
              {readiness.is_ready ? (
                <p className="text-sm text-emerald-700">All constraints met. You can now submit the final inspection.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                  {readiness.missing_items.map((m: any, i: number) => (
                    <li key={i}><strong>{m.item_text}:</strong> {m.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!isReadOnly && (
            <div className="sticky bottom-4 rounded-sm border border-slate-200 bg-white p-2 shadow-lg flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Please save draft frequently.</span>
              <div className="space-x-4">
                <Button 
                  onClick={handleSubmitFinal} 
                  disabled={!readiness?.is_ready}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed">
                  Submit Final
                </Button>
                <Button onClick={handleSaveDraft} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Draft</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
