"use client";

import { useEffect, useState } from "react";
import { Plus, CheckSquare, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useSession } from "@/lib/use-session";
import { apiRequest, getEngineers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function InspectionJobManagement() {
  const { session } = useSession();
  const [jobs, setJobs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [towers, setTowers] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    tower_id: "",
    engineer_id: "",
    planned_date: "",
  });
  const [selectedTower, setSelectedTower] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!session) return;
    try {
      const [jobsRes, clientsRes, engRes] = await Promise.all<any>([
        apiRequest("/inspection-jobs"),
        apiRequest("/clients"),
        getEngineers(session.access_token)
      ]);
      setJobs(jobsRes as any[]);
      setClients(clientsRes as any[]);
      setEngineers(engRes as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to fetch initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const handleClientChange = async (clientId: string) => {
    if (!session) return;
    setFormData({ ...formData, client_id: clientId, project_id: "", tower_id: "" });
    setSelectedTower(null);
    if (!clientId) {
      setProjects([]);
      return;
    }
    try {
      const res = await apiRequest(`/projects?client_id=${clientId}`);
      setProjects(res as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    if (!session) return;
    setFormData({ ...formData, project_id: projectId, tower_id: "" });
    setSelectedTower(null);
    if (!projectId) {
      setTowers([]);
      return;
    }
    try {
      const res = await apiRequest(`/towers?project_id=${projectId}`);
      setTowers(res as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTowerChange = (towerId: string) => {
    setFormData({ ...formData, tower_id: towerId });
    const twr = towers.find((t) => t.id.toString() === towerId);
    setSelectedTower(twr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError("");

    if (selectedTower?.checklist_selection_source === "MAPPING_MISSING" || !selectedTower?.checklist_template_id) {
      setError("Cannot assign job to tower with missing checklist mapping.");
      return;
    }

    try {
      await apiRequest("/inspection-jobs", {
        method: "POST",
        body: JSON.stringify({
          client_id: parseInt(formData.client_id),
          project_id: parseInt(formData.project_id) || null,
          tower_id: parseInt(formData.tower_id),
          engineer_id: parseInt(formData.engineer_id),
          job_type: "FIRST_INSPECTION",
          planned_date: formData.planned_date ? new Date(formData.planned_date).toISOString() : null,
        })
      });
      setIsCreating(false);
      setFormData({
        client_id: "",
        project_id: "",
        tower_id: "",
        engineer_id: "",
        planned_date: "",
      });
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create job.");
    }
  };

  return (
    <AppShell title="Inspection Jobs" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900">Assigned Jobs</h3>
            <Button size="sm" onClick={() => setIsCreating(!isCreating)} className="bg-[#0070F2] hover:bg-[#005bb5] text-white">
              <Plus className="mr-1.5 h-4 w-4" /> New Job
            </Button>
          </div>

          {error && <div className="rounded-sm bg-rose-50 p-3 text-sm text-rose-600 border border-rose-200">{error}</div>}

          {isCreating && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assign New Job</CardTitle>
                <CardDescription>Select a tower and assign an engineer to perform the inspection.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Client</label>
                    <select 
                      required 
                      className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]" 
                      value={formData.client_id} 
                      onChange={(e) => handleClientChange(e.target.value)}
                    >
                      <option value="">Select Client</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.client_name}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Site / Work Order (Optional)</label>
                    <select 
                      disabled={!formData.client_id} 
                      className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]" 
                      value={formData.project_id} 
                      onChange={(e) => handleProjectChange(e.target.value)}
                    >
                      <option value="">Select Site / Work Order</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Tower</label>
                    <select 
                      required 
                      disabled={!formData.project_id && !formData.client_id} 
                      className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]" 
                      value={formData.tower_id} 
                      onChange={(e) => handleTowerChange(e.target.value)}
                    >
                      <option value="">Select Tower</option>
                      {towers.map((t) => <option key={t.id} value={t.id}>{t.tower_code} - {t.tower_name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <label className="text-xs font-semibold text-slate-700">Tower Details & Checklist</label>
                    <div className="w-full rounded-[2px] border border-slate-200 bg-slate-50 p-2.5 text-sm">
                      {selectedTower ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-slate-600">
                            <div><span className="font-semibold text-slate-700">Address:</span> {selectedTower.address || selectedTower.location_name || 'N/A'}</div>
                            <div>
                              <span className="font-semibold text-slate-700">Coordinates:</span> 
                              {selectedTower.latitude && selectedTower.longitude ? 
                                `${selectedTower.latitude}, ${selectedTower.longitude}` : 
                                'Not set'}
                            </div>
                          </div>
                          <div className="border-t border-slate-200 pt-2">
                            {selectedTower.checklist_template_id ? (
                              <div className="flex items-center text-[#0070F2] font-medium">
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Template ID: {selectedTower.checklist_template_id} 
                              </div>
                            ) : (
                              <div className="flex items-center text-rose-600 font-medium">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                No checklist assigned to this tower.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select a tower to view details</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Assign Engineer</label>
                    <select 
                      required 
                      className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]" 
                      value={formData.engineer_id} 
                      onChange={(e) => setFormData({ ...formData, engineer_id: e.target.value })}
                    >
                      <option value="">Select Engineer</option>
                      {engineers.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.engineer_code})</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Planned Date</label>
                    <input 
                      type="date" 
                      className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" 
                      value={formData.planned_date} 
                      onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })} 
                    />
                  </div>

                  <div className="pt-6 lg:col-span-3 flex justify-end">
                    <Button type="submit" size="sm" className="bg-[#0070F2] hover:bg-[#005bb5] text-white">Assign Job</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="border border-[#E5E5E5] rounded-sm overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white uppercase bg-[#354A5F] border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-4 py-2 font-semibold">Job ID</th>
                  <th className="px-4 py-2 font-semibold">Tower ID</th>
                  <th className="px-4 py-2 font-semibold">Engineer ID</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Date Assigned</th>
                  <th className="px-4 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#E5E5E5] hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-slate-900">{job.id}</td>
                    <td className="px-4 py-2 text-slate-600">{job.tower_id}</td>
                    <td className="px-4 py-2 text-slate-600 font-medium">{job.engineer_id}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${job.status === "ASSIGNED" ? "bg-blue-100 text-blue-700" : job.status === "PUNCH_POINTS_OPEN" ? "bg-orange-100 text-orange-700" : job.status === "SUBMITTED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <a href={`/admin/inspection-jobs/${job.id}`} className="text-blue-600 text-sm font-semibold hover:underline">View</a>
                      <button
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to delete Job #${job.id}? This will delete all related cycles, responses, photos and punch points.`)) return;
                          try {
                            await apiRequest(`/inspection-jobs/${job.id}`, { method: "DELETE" });
                            loadData();
                          } catch (err: any) {
                            setError(err.message || "Failed to delete job.");
                          }
                        }}
                        className="text-rose-600 text-sm font-semibold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No jobs assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
