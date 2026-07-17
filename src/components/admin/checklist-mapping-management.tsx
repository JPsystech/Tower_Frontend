"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Building2, Settings, CheckSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";

type ChecklistMappingRule = {
  id: number;
  tenant_id: number;
  client_id: number | null;
  project_id: number | null;
  tower_type_id: number;
  inspection_type: string;
  checklist_template_id: number;
  priority: number;
  is_default: boolean;
  status: string;
  created_at: string;
  client?: { id: number; client_name: string };
  project?: { id: number; project_name: string };
  tower_type?: { id: number; type_name: string };
  checklist_template?: { id: number; template_name: string; template_code: string };
};

type OptionItem = {
  id: number;
  name: string;
  code?: string;
};

export function ChecklistMappingManagement() {
  const [rules, setRules] = useState<ChecklistMappingRule[]>([]);
  const [clients, setClients] = useState<OptionItem[]>([]);
  const [projects, setProjects] = useState<{ id: number; project_name: string; client_id: number }[]>([]);
  const [towerTypes, setTowerTypes] = useState<OptionItem[]>([]);
  const [templates, setTemplates] = useState<{ id: number; template_name: string; tower_type_id: number }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ChecklistMappingRule | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_id: "0",
    project_id: "0",
    tower_type_id: "",
    inspection_type: "FIRST_INSPECTION",
    checklist_template_id: "",
    priority: "1",
    is_default: false,
    status: "ACTIVE",
  });

  const fetchData = async () => {
    try {
      const [rulesRes, clientsRes, projectsRes, towerTypesRes, templatesRes] = await Promise.all([
        apiRequest<ChecklistMappingRule[]>("/checklist-mapping-rules"),
        apiRequest<any[]>("/clients"),
        apiRequest<any[]>("/projects"),
        apiRequest<any[]>("/tower-types"),
        apiRequest<any[]>("/checklist-templates"),
      ]);
      setRules(rulesRes);
      setClients(clientsRes.map((c: any) => ({ id: c.id, name: c.client_name })));
      setProjects(projectsRes);
      setTowerTypes(towerTypesRes.map((t: any) => ({ id: t.id, name: t.type_name })));
      setTemplates(templatesRes);
      setError(null);
    } catch (err) {
      setError("Please try again later");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        client_id: formData.client_id !== "0" ? parseInt(formData.client_id) : null,
        project_id: formData.project_id !== "0" ? parseInt(formData.project_id) : null,
        tower_type_id: parseInt(formData.tower_type_id),
        inspection_type: formData.inspection_type,
        checklist_template_id: parseInt(formData.checklist_template_id),
        priority: parseInt(formData.priority),
        is_default: formData.is_default,
        status: formData.status,
      };

      if (editingRule) {
        await apiRequest(`/checklist-mapping-rules/${editingRule.id}`, { method: "PUT", body: JSON.stringify(payload) });
        setMessage("Rule updated successfully");
      } else {
        await apiRequest("/checklist-mapping-rules", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Rule created successfully");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Please try again later");
    }
  };

  const filteredProjects = projects.filter(
    (p) => formData.client_id === "0" || p.client_id === parseInt(formData.client_id)
  );

  const filteredTemplates = templates.filter(
    (t) => formData.tower_type_id === "" || t.tower_type_id === parseInt(formData.tower_type_id)
  );

  return (
    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-xl text-slate-800">Checklist Mapping Rules</CardTitle>
          <CardDescription>Configure which checklist applies to which tower automatically</CardDescription>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95"
          onClick={() => {
            setEditingRule(null);
            setFormData({
              client_id: "0",
              project_id: "0",
              tower_type_id: "",
              inspection_type: "FIRST_INSPECTION",
              checklist_template_id: "",
              priority: "1",
              is_default: false,
              status: "ACTIVE",
            });
            setMessage(null);
            setError(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="w-[80px] p-2 text-left">Priority</th>
              <th className="p-2 text-left">Target (Client / Project)</th>
              <th className="p-2 text-left">Tower Type</th>
              <th className="p-2 text-left">Template</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Status</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-32 text-center text-slate-500">
                  No mapping rules configured
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="group transition-colors hover:bg-slate-50/50">
                  <td className="p-2 font-medium">
                    <Badge className="bg-slate-100 text-slate-800">{rule.priority}</Badge>
                  </td>
                  <td className="p-2">
                    {rule.project ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{rule.project.project_name}</span>
                        <span className="text-xs text-slate-500">Project Rule</span>
                      </div>
                    ) : rule.client ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{rule.client.client_name}</span>
                        <span className="text-xs text-slate-500">Client Rule</span>
                      </div>
                    ) : rule.is_default ? (
                      <Badge className="bg-indigo-100 text-indigo-700">Type Default</Badge>
                    ) : (
                      <span className="text-slate-500">General</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {rule.tower_type?.type_name}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-slate-900">
                        {rule.checklist_template?.template_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge className="bg-white">{rule.inspection_type}</Badge>
                  </td>
                  <td className="p-2">
                    <Badge className={rule.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 border-transparent" : "bg-rose-100 text-rose-800 border-transparent"}>
                      {rule.status}
                    </Badge>
                  </td>
                  <td className="text-right p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setFormData({
                          client_id: rule.client_id ? rule.client_id.toString() : "0",
                          project_id: rule.project_id ? rule.project_id.toString() : "0",
                          tower_type_id: rule.tower_type_id.toString(),
                          inspection_type: rule.inspection_type,
                          checklist_template_id: rule.checklist_template_id.toString(),
                          priority: rule.priority.toString(),
                          is_default: rule.is_default,
                          status: rule.status,
                        });
                        setIsDialogOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-sm bg-white p-3 shadow-xl">
            <h3 className="mb-4 text-sm font-bold">{editingRule ? "Edit Rule" : "Create Mapping Rule"}</h3>
            <p className="text-sm text-slate-500 mb-4">Rules dictate how checklist templates are auto-assigned to newly created towers.</p>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client (Optional)</label>
                <select
                  className="w-full border rounded-sm h-10 px-3 text-sm bg-white"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value, project_id: "0" })}
                >
                  <option value="0">All Clients (Default)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project (Optional)</label>
                <select
                  className="w-full border rounded-sm h-10 px-3 text-sm bg-white"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  disabled={formData.client_id === "0"}
                >
                  <option value="0">All Projects (Default)</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tower Type (Required)</label>
                <select
                  className="w-full border rounded-sm h-10 px-3 text-sm bg-white"
                  value={formData.tower_type_id}
                  onChange={(e) => setFormData({ ...formData, tower_type_id: e.target.value, checklist_template_id: "" })}
                  required
                >
                  <option value="" disabled>Select tower type</option>
                  {towerTypes.map((t) => (
                    <option key={t.id} value={t.id.toString()}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Checklist Template (Required)</label>
                <select
                  className="w-full border rounded-sm h-10 px-3 text-sm bg-white"
                  value={formData.checklist_template_id}
                  onChange={(e) => setFormData({ ...formData, checklist_template_id: e.target.value })}
                  disabled={!formData.tower_type_id}
                  required
                >
                  <option value="" disabled>Select template</option>
                  {filteredTemplates.map((t) => (
                    <option key={t.id} value={t.id.toString()}>{t.template_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Inspection Type</label>
                <select
                  className="w-full border rounded-sm h-10 px-3 text-sm bg-white"
                  value={formData.inspection_type}
                  onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
                  required
                >
                  <option value="FIRST_INSPECTION">First Inspection</option>
                  <option value="REINSPECTION">Re-Inspection</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority (1 is highest)</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full border rounded-sm h-10 px-3 text-sm bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                <label htmlFor="is_default" className="text-sm font-medium">Set as default for this Tower Type</label>
              </div>

              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-2 pt-4 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingRule ? "Save Changes" : "Create Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
