"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { CheckCircle2, ChevronRight, Circle, Plus, TowerControl as Tower } from "lucide-react";

export function SiteSetupWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [towerTypes, setTowerTypes] = useState<any[]>([]);
  const [towers, setTowers] = useState<any[]>([]);

  // Selections
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Forms
  const [newClient, setNewClient] = useState({ client_name: "", client_code: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({ project_name: "", project_code: "", location: "" });
  const [newTowerType, setNewTowerType] = useState({ name: "", height: "30", sections: "3" });
  const [newTower, setNewTower] = useState({ tower_code: "", location: "", tower_type_id: "" });

  useEffect(() => {
    loadClients();
    loadTowerTypes();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadProjects(selectedClientId);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadTowers(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadClients = async () => {
    try {
      const data = await apiRequest<any[]>("/clients");
      setClients(data);
    } catch (e) { console.error(e); }
  };

  const loadProjects = async (clientId: number) => {
    try {
      const data = await apiRequest<any[]>("/projects");
      setProjects(data.filter(p => p.client_id === clientId));
    } catch (e) { console.error(e); }
  };

  const loadTowerTypes = async () => {
    try {
      const data = await apiRequest<any[]>("/tower-types");
      setTowerTypes(data);
    } catch (e) { console.error(e); }
  };

  const loadTowers = async (projectId: number) => {
    try {
      const data = await apiRequest<any[]>("/towers");
      setTowers(data.filter(t => t.project_id === projectId));
    } catch (e) { console.error(e); }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest<any>("/clients", {
        method: "POST",
        body: JSON.stringify(newClient),
      });
      await loadClients();
      setSelectedClientId(res.id);
      setNewClient({ client_name: "", client_code: "", email: "", phone: "" });
      setStep(2);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const res = await apiRequest<any>("/projects", {
        method: "POST",
        body: JSON.stringify({ ...newProject, client_id: selectedClientId }),
      });
      await loadProjects(selectedClientId);
      setSelectedProjectId(res.id);
      setNewProject({ project_name: "", project_code: "", location: "" });
      setStep(3);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleCreateTowerType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest<any>("/tower-types", {
        method: "POST",
        body: JSON.stringify({ 
          name: newTowerType.name,
          description: "Created via wizard",
          height: parseFloat(newTowerType.height),
          sections: parseInt(newTowerType.sections)
        }),
      });
      await loadTowerTypes();
      setNewTowerType({ name: "", height: "30", sections: "3" });
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleCreateTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      await apiRequest<any>("/towers", {
        method: "POST",
        body: JSON.stringify({ 
          project_id: selectedProjectId,
          tower_type_id: parseInt(newTower.tower_type_id),
          tower_code: newTower.tower_code,
          location: newTower.location,
          status: "ACTIVE"
        }),
      });
      await loadTowers(selectedProjectId);
      setNewTower({ tower_code: "", location: "", tower_type_id: newTower.tower_type_id });
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <AppShell title="Site Setup Workflow" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Wizard Steps Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-sm border border-[#E5E5E5]">
          {[
            { num: 1, label: "Client Details" },
            { num: 2, label: "Project/Site" },
            { num: 3, label: "Tower Definitions" }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div 
                onClick={() => {
                  if (s.num < step || (s.num === 2 && selectedClientId) || (s.num === 3 && selectedProjectId)) {
                    setStep(s.num);
                  }
                }}
                className={`flex flex-col items-center cursor-pointer ${step >= s.num ? "text-[#0070F2]" : "text-slate-400"}`}
              >
                {step > s.num ? <CheckCircle2 className="w-8 h-8" /> : <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === s.num ? "border-[#0070F2] bg-blue-50 font-bold" : "border-slate-300 font-semibold"}`}>{s.num}</div>}
                <span className="text-xs font-semibold uppercase tracking-wider mt-2">{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? "bg-[#0070F2]" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: CLIENT */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select or Create Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold mb-4 border-b pb-2">Existing Clients</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {clients.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedClientId(c.id); setStep(2); }}
                        className={`p-3 border rounded-sm cursor-pointer transition-colors ${selectedClientId === c.id ? "border-[#0070F2] bg-blue-50" : "border-[#E5E5E5] hover:bg-slate-50"}`}
                      >
                        <div className="font-semibold">{c.client_name}</div>
                        <div className="text-xs text-slate-500">{c.client_code} | {c.email}</div>
                      </div>
                    ))}
                    {clients.length === 0 && <p className="text-sm text-slate-500">No clients available.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-4 border-b pb-2">Create New Client</h3>
                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Code</label>
                      <Input required value={newClient.client_code} onChange={e => setNewClient({...newClient, client_code: e.target.value})} placeholder="e.g. CLI001" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                      <Input required value={newClient.client_name} onChange={e => setNewClient({...newClient, client_name: e.target.value})} placeholder="e.g. Acme Corp" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                      <Input required type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                      <Input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                    </div>
                    <button disabled={loading} className="w-full bg-[#0070F2] text-white px-4 py-2 rounded-sm font-semibold hover:bg-[#005CC8] transition-colors shadow-sm">
                      {loading ? "Saving..." : "Save & Continue"}
                    </button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: PROJECT */}
        {step === 2 && (
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle>Project/Site Setup for {selectedClient?.client_name}</CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold mb-4 border-b pb-2">Existing Projects for this Client</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {projects.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => { setSelectedProjectId(p.id); setStep(3); }}
                        className={`p-3 border rounded-sm cursor-pointer transition-colors ${selectedProjectId === p.id ? "border-[#0070F2] bg-blue-50" : "border-[#E5E5E5] hover:bg-slate-50"}`}
                      >
                        <div className="font-semibold">{p.project_name}</div>
                        <div className="text-xs text-slate-500">{p.project_code} | {p.location}</div>
                      </div>
                    ))}
                    {projects.length === 0 && <p className="text-sm text-slate-500">No projects found. Please create one.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-4 border-b pb-2">Create New Project</h3>
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project/Site Code</label>
                      <Input required value={newProject.project_code} onChange={e => setNewProject({...newProject, project_code: e.target.value})} placeholder="e.g. PRJ001" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project/Site Name</label>
                      <Input required value={newProject.project_name} onChange={e => setNewProject({...newProject, project_name: e.target.value})} placeholder="e.g. Downtown Site A" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                      <Input value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} />
                    </div>
                    <button disabled={loading} className="w-full bg-[#0070F2] text-white px-4 py-2 rounded-sm font-semibold hover:bg-[#005CC8] transition-colors shadow-sm">
                      {loading ? "Saving..." : "Save & Continue"}
                    </button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: TOWERS */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-slate-50">
                <CardTitle>Master Definitions for {selectedProject?.project_name}</CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Tower Types */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 border-b pb-2 flex justify-between items-center">
                      <span>Available Tower Types</span>
                    </h3>
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {towerTypes.map(tt => (
                        <div key={tt.id} className="p-2 border border-[#E5E5E5] rounded-sm text-sm bg-slate-50">
                          <span className="font-semibold">{tt.name}</span> - {tt.height}m, {tt.sections} Sections
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleCreateTowerType} className="p-3 border border-slate-200 bg-slate-50 rounded-sm space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500">Quick Add Tower Type</h4>
                      <div>
                        <Input required placeholder="Type Name (e.g. Mono 30m)" value={newTowerType.name} onChange={e => setNewTowerType({...newTowerType, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input required type="number" placeholder="Height (m)" value={newTowerType.height} onChange={e => setNewTowerType({...newTowerType, height: e.target.value})} />
                        <Input required type="number" placeholder="Sections" value={newTowerType.sections} onChange={e => setNewTowerType({...newTowerType, sections: e.target.value})} />
                      </div>
                      <button disabled={loading} className="w-full bg-slate-800 text-white px-3 py-1.5 text-sm rounded-sm font-semibold hover:bg-slate-700 transition-colors">
                        Add Type
                      </button>
                    </form>
                  </div>

                  {/* Add Towers */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 border-b pb-2">Add Tower to Project</h3>
                    <form onSubmit={handleCreateTower} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tower Type</label>
                        <select 
                          required 
                          className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#0070F2] focus:ring-1"
                          value={newTower.tower_type_id}
                          onChange={e => setNewTower({...newTower, tower_type_id: e.target.value})}
                        >
                          <option value="">-- Select Type --</option>
                          {towerTypes.map(tt => (
                            <option key={tt.id} value={tt.id}>{tt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tower Code / ID</label>
                        <Input required value={newTower.tower_code} onChange={e => setNewTower({...newTower, tower_code: e.target.value})} placeholder="e.g. T-001" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location Coordinates</label>
                        <Input value={newTower.location} onChange={e => setNewTower({...newTower, location: e.target.value})} placeholder="Lat, Long" />
                      </div>
                      <button disabled={loading} className="w-full bg-[#0070F2] text-white px-4 py-2 rounded-sm font-semibold hover:bg-[#005CC8] transition-colors shadow-sm flex items-center justify-center">
                        <Plus className="w-4 h-4 mr-2" /> Add Tower
                      </button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Towers Table */}
            <Card>
              <CardHeader className="bg-slate-50">
                <CardTitle>Towers in {selectedProject?.project_name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tower Code</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {towers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-slate-500">No towers added to this project yet.</td>
                      </tr>
                    ) : (
                      towers.map(t => {
                        const type = towerTypes.find(tt => tt.id === t.tower_type_id);
                        return (
                          <tr key={t.id} className="border-b border-[#E5E5E5] hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{t.tower_code}</td>
                            <td className="px-4 py-3">{type?.name || "Unknown"}</td>
                            <td className="px-4 py-3 text-slate-500">{t.location || "N/A"}</td>
                            <td className="px-4 py-3">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-medium">{t.status}</span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </AppShell>
  );
}
