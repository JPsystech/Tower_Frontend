"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertCircle, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import type { Client } from "@/components/admin/client-management";
import type { TowerType } from "@/components/admin/tower-type-management";

type Project = {
  id: number;
  tenant_id: number;
  client_id: number;
  project_name: string;
  project_code: string;
  status: string;
};

type Tower = {
  id: number;
  tenant_id: number;
  client_id: number;
  project_id: number;
  tower_type_id: number;
  tower_code: string;
  tower_name: string;
  location_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  height: number | null;
  drawing_no: string | null;
  chainage: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  checklist_template_id: number | null;
  checklist_auto_selected: boolean;
  checklist_selection_source: string | null;
  tower_type?: TowerType;
  client?: Client;
  project?: Project;
  checklist_template?: { id: number; template_name: string; template_code: string };
};

const TOWER_STATUSES = ["DRAFT", "ACTIVE", "HOLD", "INACTIVE"];

const emptyForm = {
  client_id: 0,
  project_id: 0,
  tower_type_id: 0,
  tower_code: "",
  tower_name: "",
  location_name: "",
  address: "",
  latitude: "",
  longitude: "",
  height: "",
  drawing_no: "",
  chainage: "",
  status: "DRAFT",
  checklist_template_id: 0,
};

export function TowerManagement() {
  const [towers, setTowers] = useState<Tower[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [towerTypes, setTowerTypes] = useState<TowerType[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<Tower | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const heading = useMemo(() => (selected ? "Edit Tower" : "Create Tower"), [selected]);

  // Projects filtered by selected client
  const filteredProjects = useMemo(
    () => allProjects.filter((p) => p.client_id === Number(form.client_id) && p.status === "ACTIVE"),
    [allProjects, form.client_id],
  );

  // Active tower types for dropdown
  const activeTowerTypes = useMemo(
    () => towerTypes.filter((t) => t.status === "ACTIVE" || t.id === Number(form.tower_type_id)),
    [towerTypes, form.tower_type_id],
  );

  // Active clients for dropdown
  const activeClients = useMemo(
    () => clients.filter((c) => c.status === "ACTIVE" || c.id === Number(form.client_id)),
    [clients, form.client_id],
  );

  async function loadAll() {
    try {
      setIsLoading(true);
      const [towersRes, clientsRes, projectsRes, ttRes, clRes] = await Promise.all([
        apiRequest<Tower[]>("/towers"),
        apiRequest<Client[]>("/clients"),
        apiRequest<Project[]>("/projects"),
        apiRequest<TowerType[]>("/tower-types"),
        apiRequest<any[]>("/checklist-templates"),
      ]);
      setTowers(towersRes);
      setClients(clientsRes);
      setAllProjects(projectsRes);
      setTowerTypes(ttRes);
      setChecklistTemplates(clRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  function selectItem(tower: Tower | null) {
    setSelected(tower);
    setMessage(null);
    setError(null);
    if (!tower) { setForm(emptyForm); return; }
    setForm({
      client_id: tower.client_id,
      project_id: tower.project_id,
      tower_type_id: tower.tower_type_id,
      tower_code: tower.tower_code,
      tower_name: tower.tower_name,
      location_name: tower.location_name || "",
      address: tower.address || "",
      latitude: tower.latitude?.toString() || "",
      longitude: tower.longitude?.toString() || "",
      height: tower.height !== null ? String(tower.height) : "",
      drawing_no: tower.drawing_no ?? "",
      chainage: tower.chainage ?? "",
      status: tower.status,
      checklist_template_id: tower.checklist_template_id ?? 0,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      client_id: Number(form.client_id),
      project_id: Number(form.project_id),
      tower_type_id: Number(form.tower_type_id),
      tower_code: form.tower_code,
      tower_name: form.tower_name,
      location_name: form.location_name || null,
      address: form.address || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      height: form.height ? Number(form.height) : null,
      drawing_no: form.drawing_no || null,
      chainage: form.chainage || null,
      status: form.status,
      checklist_template_id: form.checklist_template_id ? Number(form.checklist_template_id) : null,
    };

    try {
      if (selected) {
        await apiRequest<Tower>(`/towers/${selected.id}`, { method: "PUT", body: JSON.stringify(payload) });
        setMessage("Tower updated successfully.");
      } else {
        await apiRequest<Tower>("/towers", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Tower created successfully.");
      }
      selectItem(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save tower");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this tower?")) return;
    try {
      await apiRequest(`/towers/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  }

  const statusColor: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    HOLD: "bg-amber-100 text-amber-700",
    INACTIVE: "bg-rose-100 text-rose-600",
  };

  return (
    <AppShell title="Tower Master" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        {/* Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Towers</CardTitle>
              <CardDescription>All towers registered under this tenant.</CardDescription>
            </div>
            <a
              href="/admin/checklist-templates"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded bg-[#0070F2] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#005bb5]"
            >
              <CheckSquare className="h-4 w-4" />
              Checklist Builder
            </a>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading towers...</p>
            ) : (
              <div className="border border-[#E5E5E5] rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white uppercase bg-[#354A5F] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Tower</th>
                      <th className="px-4 py-2 font-semibold">Code</th>
                      <th className="px-4 py-2 font-semibold">Type</th>
                      <th className="px-4 py-2 font-semibold">Client</th>
                      <th className="px-4 py-2 font-semibold">Checklist</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {towers.map((tower) => (
                      <tr 
                        key={tower.id} 
                        className={`border-b border-[#E5E5E5] transition-colors cursor-pointer ${selected?.id === tower.id ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-slate-50"}`}
                        onClick={() => selectItem(tower)}
                      >
                        <td className="px-4 py-2 font-medium text-slate-900">{tower.tower_name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-600">{tower.tower_code}</td>
                        <td className="px-4 py-2 text-slate-600">{tower.tower_type?.type_name ?? "Unknown"}</td>
                        <td className="px-4 py-2 text-slate-600">{tower.client?.client_name ?? "Unknown"}</td>
                        <td className="px-4 py-2">
                          {tower.checklist_template ? (
                            <span className="text-xs text-blue-600 font-medium">
                              {tower.checklist_template.template_code}
                              {tower.checklist_auto_selected && <span className="ml-1 text-slate-400" title={`Auto-selected via ${tower.checklist_selection_source}`}>(Auto)</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[tower.status] || "bg-slate-100 text-slate-600"}`}>
                            {tower.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button onClick={(e) => { e.stopPropagation(); selectItem(tower); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(tower.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{heading}</CardTitle>
            <CardDescription>Register a tower under a client, project, and tower type.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* Client dropdown */}
              <Field label="Client">
                  <select
                    required
                    className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                    value={form.client_id}
                  onChange={(e) => setForm((c) => ({ ...c, client_id: Number(e.target.value), project_id: 0 }))}
                >
                  <option value={0} disabled>Select Client</option>
                  {activeClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.client_name} ({c.client_code})</option>
                  ))}
                </select>
              </Field>

              {/* Project dropdown — filtered by client */}
              <Field label="Project">
                  <select
                    required
                    className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                    value={form.project_id}
                  onChange={(e) => setForm((c) => ({ ...c, project_id: Number(e.target.value) }))}
                  disabled={!form.client_id}
                >
                  <option value={0} disabled>Select Project</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name} ({p.project_code})</option>
                  ))}
                </select>
              </Field>

              {/* Tower Type dropdown */}
              <Field label="Tower Type">
                  <select
                    required
                    className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                    value={form.tower_type_id}
                  onChange={(e) => setForm((c) => ({ ...c, tower_type_id: Number(e.target.value) }))}
                >
                  <option value={0} disabled>Select Tower Type</option>
                  {activeTowerTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.type_name} ({t.type_code})</option>
                  ))}
                </select>
              </Field>

              <Field label="Tower Code">
                <Input required value={form.tower_code}
                  onChange={(e) => setForm((c) => ({ ...c, tower_code: e.target.value }))} />
              </Field>

              <Field label="Tower Name">
                <Input required value={form.tower_name}
                  onChange={(e) => setForm((c) => ({ ...c, tower_name: e.target.value }))} />
              </Field>

              <Field label="Address">
                <Input required value={form.address}
                  onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <Input type="number" step="any" required value={form.latitude}
                    onChange={(e) => setForm((c) => ({ ...c, latitude: e.target.value }))} />
                </Field>
                <Field label="Longitude">
                  <Input type="number" step="any" required value={form.longitude}
                    onChange={(e) => setForm((c) => ({ ...c, longitude: e.target.value }))} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (m)">
                  <Input type="number" step="any" value={form.height}
                    onChange={(e) => setForm((c) => ({ ...c, height: e.target.value }))} />
                </Field>
                <Field label="Chainage">
                  <Input value={form.chainage}
                    onChange={(e) => setForm((c) => ({ ...c, chainage: e.target.value }))} />
                </Field>
              </div>

              <Field label="Drawing No.">
                <Input value={form.drawing_no}
                  onChange={(e) => setForm((c) => ({ ...c, drawing_no: e.target.value }))} />
              </Field>

              <Field label="Status">
                  <select
                    className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                    value={form.status}
                  onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                >
                  {TOWER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Checklist Template">
                <div className="flex flex-col gap-2">
                  <select
                    className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                    value={form.checklist_template_id}
                    onChange={(e) => setForm((c) => ({ ...c, checklist_template_id: Number(e.target.value) }))}
                  >
                    <option value={0}>No Checklist</option>
                    {checklistTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.template_name} ({t.template_code})</option>
                    ))}
                  </select>
                  <a
                    href="/admin/checklist-templates"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium w-fit"
                  >
                    <CheckSquare className="w-3 h-3" />
                    Open Checklist Builder
                  </a>
                </div>
              </Field>

              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : selected ? "Update Tower" : "Create Tower"}
                </Button>
                <Button type="button" variant="outline" onClick={() => selectItem(null)}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
