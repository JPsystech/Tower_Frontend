"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useSession } from "@/lib/use-session";
import { apiRequest, getApiBaseUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, AlertTriangle, Image as ImageIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InspectionJobDetail({ jobId }: { jobId: number }) {
  const { session } = useSession();
  const [job, setJob] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [punchPoints, setPunchPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!session) return;
      try {
        setLoading(true);
        const jobData = await apiRequest(`/inspection-jobs/${jobId}`);
        setJob(jobData);

        const cycleData = await apiRequest(`/inspection-cycles?inspection_job_id=${jobId}`);
        setCycles(cycleData as any[]);

        if (cycleData && (cycleData as any[]).length > 0) {
          const firstCycle = (cycleData as any[])[0];
          const respData = await apiRequest(`/inspection-responses?inspection_cycle_id=${firstCycle.id}`);
          setResponses(respData as any[]);
        }

        const ppData = await apiRequest(`/inspection-jobs/${jobId}/punch-points`);
        setPunchPoints(ppData as any[]);
      } catch (err: any) {
        setError(err.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId, session]);

  const handleVerifyPunchPoint = async (ppId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "READY_FOR_VERIFICATION" ? "CLOSED" : "CLOSED";
      await apiRequest(`/punch-points/${ppId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus, closure_remarks: "Verified by Admin" })
      });
      // reload punch points
      const ppData = await apiRequest(`/inspection-jobs/${jobId}/punch-points`);
      setPunchPoints(ppData as any[]);
    } catch (err: any) {
      alert("Failed to verify punch point: " + err.message);
    }
  };

  const handleApproveJob = async () => {
    try {
      setIsApproving(true);
      const updated = await apiRequest(`/inspection-jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "CLOSED", admin_remarks: adminRemarks })
      });
      setJob(updated);
      setIsApproveModalOpen(false);
    } catch (err: any) {
      alert("Failed to approve job: " + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) return <AppShell title="Job Details"><p>Loading...</p></AppShell>;
  if (error) return <AppShell title="Job Details"><p className="text-red-600">{error}</p></AppShell>;
  if (!job) return <AppShell title="Job Details"><p>Job not found</p></AppShell>;

  const getImageUrl = (url: string) => url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "SUBMITTED": return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">Submitted</span>;
      case "CLOSED": return <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">Closed</span>;
      case "PUNCH_POINTS_OPEN": return <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">Punch Points Open</span>;
      case "IN_PROGRESS": return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">In Progress</span>;
      default: return <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <AppShell title={`Inspection Job #${job.id}`} allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Job Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(job.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tower</p>
                <p className="font-medium">{job.tower?.tower_name} ({job.tower?.tower_code})</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project / Client</p>
                <p className="font-medium">{job.project?.project_name} / {job.client?.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Checklist Template</p>
                <p className="font-medium">{job.checklist_template?.template_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Planned Date</p>
                <p className="font-medium">{job.planned_date ? new Date(job.planned_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              {job.admin_remarks && (
                <div>
                  <p className="text-sm text-gray-500">Admin Remarks</p>
                  <p className="font-medium text-sm mt-1 p-2 bg-slate-50 rounded border">{job.admin_remarks}</p>
                </div>
              )}
              {job.status !== "CLOSED" && (job.status === "SUBMITTED" || job.status === "PUNCH_POINTS_OPEN") && (
                <div className="pt-4 border-t">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsApproveModalOpen(true)}>
                    Approve Submissions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Responses & Punch Points */}
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Punch Points
              </CardTitle>
              <CardDescription>Issues found during inspection that require resolution.</CardDescription>
            </CardHeader>
            <CardContent>
              {punchPoints.length === 0 ? (
                <p className="text-sm text-gray-500">No punch points generated for this job.</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const sectionsMap = new Map();
                    punchPoints.forEach((pp: any) => {
                      const sectionId = pp.item?.section?.id || pp.section?.id || 0;
                      const sectionName = pp.item?.section?.section_name || pp.section?.section_name || "General Section";
                      const sectionOrder = pp.item?.section?.section_order || pp.section?.section_order || 0;
                      
                      if (!sectionsMap.has(sectionId)) {
                        sectionsMap.set(sectionId, {
                          name: sectionName,
                          order: sectionOrder,
                          items: []
                        });
                      }
                      sectionsMap.get(sectionId).items.push(pp);
                    });

                    const sortedSections = Array.from(sectionsMap.values()).sort((a: any, b: any) => a.order - b.order);
                    
                    sortedSections.forEach((section: any) => {
                      section.items.sort((a: any, b: any) => (a.item?.item_order || 0) - (b.item?.item_order || 0));
                    });

                    return sortedSections.map((sectionGroup: any) => (
                      <div key={sectionGroup.name} className="space-y-3 mb-4">
                        <div className="bg-slate-100 px-3 py-2 rounded-md border border-slate-200 shadow-sm flex items-center">
                          <h3 className="font-bold text-slate-700 text-sm tracking-wide">{sectionGroup.name}</h3>
                        </div>
                        <div className="space-y-4">
                          {sectionGroup.items.map((pp: any) => (
                            <div key={pp.id} className="p-4 rounded-md border border-gray-200 bg-white flex flex-col gap-2 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider mb-1">
                                    {pp.item?.component_type ? `${pp.item.component_type} • ` : ''}Item ID: {pp.checklist_item_id}
                                  </span>
                                  <p className="font-semibold text-slate-800 mb-1">{pp.item?.item_text || `Checklist Item #${pp.checklist_item_id}`}</p>
                                  <p className="text-sm text-gray-600">Status: <span className="font-medium text-orange-600">{pp.status}</span></p>
                                </div>
                                {pp.status !== "CLOSED" && (
                                  <Button size="sm" variant="outline" onClick={() => handleVerifyPunchPoint(pp.id, pp.status)}>
                                    Verify & Close
                                  </Button>
                                )}
                              </div>
                              {pp.closure_remarks && (
                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">Remarks: {pp.closure_remarks}</p>
                              )}
                              
                              <div className="mt-2 flex flex-wrap gap-4">
                                {pp.original_photos && pp.original_photos.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Issue Photos</p>
                                    <div className="flex gap-2">
                                      {pp.original_photos.map((p: any) => (
                                        <a key={p.id} href={getImageUrl(p.photo_url)} target="_blank" rel="noopener noreferrer" className="block relative group">
                                          <img src={getImageUrl(p.photo_url)} alt="Issue Photo" className="h-16 w-16 object-cover rounded border border-red-200 group-hover:opacity-80 transition-opacity" />
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                            <span className="text-white text-xs font-bold drop-shadow-md">Open</span>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {pp.closure_photos && pp.closure_photos.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Resolution Photos</p>
                                    <div className="flex gap-2">
                                      {pp.closure_photos.map((p: any) => (
                                        <a key={p.id} href={getImageUrl(p.photo_url)} target="_blank" rel="noopener noreferrer" className="block relative group">
                                          <img src={getImageUrl(p.photo_url)} alt="Resolution Photo" className="h-16 w-16 object-cover rounded border border-green-200 group-hover:opacity-80 transition-opacity" />
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                            <span className="text-white text-xs font-bold drop-shadow-md">Open</span>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                Inspection Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-sm text-gray-500">No responses recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const sectionsMap = new Map();
                    responses.forEach((r: any) => {
                      const sectionId = r.item?.section?.id || 0;
                      const sectionName = r.item?.section?.section_name || "General Section";
                      const sectionOrder = r.item?.section?.section_order || 0;
                      
                      if (!sectionsMap.has(sectionId)) {
                        sectionsMap.set(sectionId, {
                          name: sectionName,
                          order: sectionOrder,
                          items: []
                        });
                      }
                      sectionsMap.get(sectionId).items.push(r);
                    });

                    const sortedSections = Array.from(sectionsMap.values()).sort((a: any, b: any) => a.order - b.order);
                    
                    sortedSections.forEach((section: any) => {
                      section.items.sort((a: any, b: any) => (a.item?.item_order || 0) - (b.item?.item_order || 0));
                    });

                    return sortedSections.map((sectionGroup: any) => (
                      <div key={sectionGroup.name} className="space-y-3">
                        <div className="bg-slate-100 px-3 py-2 rounded-md border border-slate-200 shadow-sm flex items-center">
                          <h3 className="font-bold text-slate-700 text-sm tracking-wide">{sectionGroup.name}</h3>
                        </div>
                        <div className="space-y-3">
                          {sectionGroup.items.map((r: any) => (
                            <div key={r.id} className="p-3 bg-white border border-slate-200 rounded flex justify-between items-center shadow-sm">
                              <div>
                                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider mb-1">
                                  {r.item?.component_type ? `${r.item.component_type} • ` : ''}Item ID: {r.checklist_item_id}
                                </span>
                                <p className="font-semibold text-slate-800 mb-1">{r.item?.item_text || `Item #${r.checklist_item_id}`}</p>
                                <p className="text-sm font-medium">{r.answer_status === "PASS" ? "Passed" : r.answer_status === "FAIL" ? "Failed" : r.answer_status}</p>
                                {r.remarks && <p className="text-xs text-gray-600">Note: {r.remarks}</p>}
                                
                                {r.photos && r.photos.length > 0 && (
                                  <div className="flex gap-2 mt-2">
                                    {r.photos.map((p: any) => (
                                      <a key={p.id} href={getImageUrl(p.photo_url)} target="_blank" rel="noopener noreferrer" className="block relative group">
                                        <img src={getImageUrl(p.photo_url)} alt="Response Photo" className="h-16 w-16 object-cover rounded border border-gray-200 group-hover:opacity-80 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                          <span className="text-white text-xs font-bold drop-shadow-md">Open</span>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                {r.answer_status === "PASS" ? <CheckCircle className="text-green-500 w-5 h-5" /> : <XCircle className="text-red-500 w-5 h-5" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Approve Job Submissions</h2>
            <p className="text-sm text-slate-600 mb-4">
              You are about to approve this job and close it. Please enter any remarks below.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
              <textarea
                className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={4}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter approval remarks..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleApproveJob} 
                disabled={isApproving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isApproving ? "Approving..." : "Approve Job"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
