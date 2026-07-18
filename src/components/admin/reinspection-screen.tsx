"use client";

import { useEffect, useState } from "react";
import { apiRequest, getApiBaseUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { PunchPoint } from "./reinspection-management";
import { Camera, CheckCircle, Save, XCircle } from "lucide-react";

export function ReinspectionScreen({ jobId }: { jobId: string }) {
  const [punchPoints, setPunchPoints] = useState<PunchPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Local state for edits
  const [edits, setEdits] = useState<Record<number, { remark: string }>>({});

  const router = useRouter();

  const getImageUrl = (url: string) => url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;

  useEffect(() => {
    loadData();
  }, [jobId]);

  async function loadData() {
    try {
      setIsLoading(true);
      const data = await apiRequest<PunchPoint[]>(`/inspection-jobs/${jobId}/punch-points`);
      // Filter out CLOSED if we only want "open" ones, but let's show all that are not CLOSED
      const active = data.filter(p => p.status !== "CLOSED");
      setPunchPoints(active);
      
      const newEdits: Record<number, { remark: string }> = {};
      active.forEach(p => {
        newEdits[p.id] = { remark: p.closure_remarks || "" };
      });
      setEdits(newEdits);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(id: number, status: string) {
    try {
      setSavingId(id);
      const remark = edits[id]?.remark || "";
      await apiRequest(`/punch-points/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          closure_remarks: remark,
          status: status
        }),
      });
      // reload
      await loadData();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) return <div className="p-4 text-slate-500">Loading punch points...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Job #{jobId} Reinspection</h2>
          <p className="text-sm text-slate-500">Address open punch points for this inspection.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/reinspections")}>
          Back to List
        </Button>
      </div>

      {punchPoints.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            No active punch points for this job. All clear!
          </CardContent>
        </Card>
      ) : (
        punchPoints.map(pp => (
          <Card key={pp.id} className="overflow-hidden border-slate-200">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-semibold text-slate-700">{pp.punch_no}</span>
                <Badge className={pp.severity === "HIGH" ? "bg-red-100 text-red-800 border-red-200" : "bg-slate-100 text-slate-800 border-slate-200"}>
                  {pp.severity || "NORMAL"}
                </Badge>
                <Badge className="bg-white border-slate-200 text-slate-700">{pp.status}</Badge>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Tower: {pp.tower_code || "N/A"}
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Observation */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-md border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Original Observation</h3>
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Checklist Item</div>
                  <div className="text-sm text-slate-600">{pp.title}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Result</div>
                  <div className="text-sm text-red-600 font-medium flex items-center">
                    <XCircle className="w-4 h-4 mr-1" /> Not OK
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Remarks</div>
                  <div className="text-sm text-slate-600 italic">
                    {pp.description || "No remarks provided."}
                  </div>
                </div>
                {pp.original_photos && pp.original_photos.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-800 mb-2">Original Photos</div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {pp.original_photos.map(photo => (
                        <img 
                          key={photo.id} 
                          src={getImageUrl(photo.photo_url)} 
                          alt="Original" 
                          className="h-20 w-20 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(getImageUrl(photo.photo_url))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Closure Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Closure Details</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Closure Remarks</label>
                  <Textarea 
                    placeholder="Enter actions taken to resolve this punch point..."
                    value={edits[pp.id]?.remark || ""}
                    onChange={(e) => setEdits({...edits, [pp.id]: { remark: e.target.value }})}
                    className="min-h-[100px] text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Closure Photos</label>
                  {pp.closure_photos && pp.closure_photos.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto mb-2">
                      {pp.closure_photos.map(photo => (
                        <img 
                          key={photo.id} 
                          src={getImageUrl(photo.photo_url)} 
                          alt="Closure" 
                          className="h-16 w-16 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(getImageUrl(photo.photo_url))}
                        />
                      ))}
                    </div>
                  ) : null}
                  <Button variant="outline" size="sm" className="w-full text-slate-600 border-dashed border-2">
                    <Camera className="w-4 h-4 mr-2" /> Upload Photos
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleSave(pp.id, pp.status)}
                disabled={savingId === pp.id}
              >
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleSave(pp.id, "READY_FOR_REINSPECTION")}
                disabled={savingId === pp.id}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Mark Ready
              </Button>
            </div>
          </Card>
        ))
      )}
      
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full p-2"
              onClick={() => setLightboxImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src={lightboxImage} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
