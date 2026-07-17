"use client";

import { useEffect, useState } from "react";
import { getPunchPoints, getApiBaseUrl } from "@/lib/api";
import { useSession } from "@/lib/use-session";
import { AppShell } from "@/components/layout/app-shell";

export function PunchPointsManagement() {
  const { session } = useSession();
  const [punchPoints, setPunchPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPP, setSelectedPP] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      if (!session) return;
      try {
        const res = await getPunchPoints(session.access_token);
        setPunchPoints(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  const getImageUrl = (url: string) => url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;

  if (selectedPP) {
    return (
      <AppShell title={`Punch Point: ${selectedPP.punch_no}`}>
        <div className="mb-4">
          <button onClick={() => setSelectedPP(null)} className="text-sm font-medium text-blue-600 hover:underline">
            &larr; Back to Punch Points
          </button>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{selectedPP.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedPP.description || "No description"}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedPP.status === 'READY_FOR_REINSPECTION' ? 'bg-blue-100 text-blue-800' : selectedPP.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>
                {selectedPP.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedPP.severity === "HIGH" || selectedPP.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                {selectedPP.severity}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Issue Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Issue Details</h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p><span className="font-medium text-slate-800">Coordinates:</span> {selectedPP.issue_latitude ? `${selectedPP.issue_latitude.toFixed(6)}, ${selectedPP.issue_longitude?.toFixed(6)}` : 'Not recorded'}</p>
                <p><span className="font-medium text-slate-800">Accuracy:</span> {selectedPP.issue_location_accuracy ? `${selectedPP.issue_location_accuracy}m` : 'N/A'}</p>
                {selectedPP.issue_location_is_mocked && (
                  <p className="text-red-600 font-bold">⚠️ Location was mocked</p>
                )}
                <p><span className="font-medium text-slate-800">Time:</span> {selectedPP.issue_location_timestamp ? new Date(selectedPP.issue_location_timestamp).toLocaleString() : 'N/A'}</p>
              </div>
              
              {selectedPP.original_photos?.length > 0 ? (
                <div className="mt-4">
                  <p className="font-medium text-slate-800 mb-2 text-sm">Issue Photos</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedPP.original_photos.map((photo: any) => (
                      <img key={photo.id} src={getImageUrl(photo.photo_url)} alt="Issue" className="h-48 w-48 object-cover rounded border flex-shrink-0" />
                    ))}
                  </div>
                </div>
              ) : selectedPP.issue_photo_url ? (
                <div className="mt-4">
                  <p className="font-medium text-slate-800 mb-2 text-sm">Issue Photo</p>
                  <img src={getImageUrl(selectedPP.issue_photo_url)} alt="Issue" className="w-full h-48 object-cover rounded border" />
                </div>
              ) : (
                <div className="mt-4 w-full h-48 bg-slate-100 border rounded flex items-center justify-center text-slate-400 text-sm">
                  No Issue Photo
                </div>
              )}
            </div>

            {/* Resolution Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Resolution Details</h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p><span className="font-medium text-slate-800">Coordinates:</span> {selectedPP.resolution_latitude ? `${selectedPP.resolution_latitude.toFixed(6)}, ${selectedPP.resolution_longitude?.toFixed(6)}` : 'Not recorded'}</p>
                <p><span className="font-medium text-slate-800">Accuracy:</span> {selectedPP.resolution_location_accuracy ? `${selectedPP.resolution_location_accuracy}m` : 'N/A'}</p>
                {selectedPP.resolution_location_is_mocked && (
                  <p className="text-red-600 font-bold">⚠️ Location was mocked</p>
                )}
                <p><span className="font-medium text-slate-800">Time:</span> {selectedPP.resolution_location_timestamp ? new Date(selectedPP.resolution_location_timestamp).toLocaleString() : 'N/A'}</p>
                
                {selectedPP.mobile_calculated_distance_meters != null && (
                  <p><span className="font-medium text-slate-800">Deviation from Issue:</span> {selectedPP.mobile_calculated_distance_meters.toFixed(2)}m</p>
                )}
                <p><span className="font-medium text-slate-800">Remarks:</span> {selectedPP.closure_remarks || 'None'}</p>
              </div>

              {selectedPP.closure_photos?.length > 0 ? (
                <div className="mt-4">
                  <p className="font-medium text-slate-800 mb-2 text-sm">Resolution Photos</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedPP.closure_photos.map((photo: any) => (
                      <img key={photo.id} src={getImageUrl(photo.photo_url)} alt="Resolution" className="h-48 w-48 object-cover rounded border flex-shrink-0" />
                    ))}
                  </div>
                </div>
              ) : selectedPP.resolution_photo_url ? (
                <div className="mt-4">
                  <p className="font-medium text-slate-800 mb-2 text-sm">Resolution Photo</p>
                  <img src={getImageUrl(selectedPP.resolution_photo_url)} alt="Resolution" className="w-full h-48 object-cover rounded border" />
                </div>
              ) : (
                <div className="mt-4 w-full h-48 bg-slate-100 border rounded flex items-center justify-center text-slate-400 text-sm">
                  No Resolution Photo
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Punch Points">
      {loading ? (
        <div>Loading punch points...</div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Punch No</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Severity</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created Date</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {punchPoints.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{p.punch_no}</td>
                    <td className="px-6 py-4">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.severity === "HIGH" || p.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {p.severity || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{p.status}</td>
                    <td className="px-6 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedPP(p)} className="text-blue-600 hover:underline font-medium text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {punchPoints.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No punch points found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
