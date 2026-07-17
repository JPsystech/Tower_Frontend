"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
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

type Project = {
  id: number;
  tenant_id: number;
  client_id: number;
  project_name: string;
  project_code: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  client?: Client;
};

const emptyForm = {
  client_id: 0,
  project_name: "",
  project_code: "",
  location: "",
  start_date: "",
  end_date: "",
  status: "ACTIVE",
};

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const heading = useMemo(
    () => (selectedProject ? "Edit Site / Work Order" : "Create Site / Work Order"),
    [selectedProject],
  );

  async function loadData() {
    try {
      setIsLoading(true);
      const [projectsResult, clientsResult] = await Promise.all([
        apiRequest<Project[]>("/projects"),
        apiRequest<Client[]>("/clients"),
      ]);
      setProjects(projectsResult);
      setClients(clientsResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function initialize() {
      await loadData();
    }

    void initialize();
  }, []);

  function selectProject(project: Project | null) {
    setSelectedProject(project);
    setMessage(null);
    setError(null);
    if (!project) {
      setForm(emptyForm);
      return;
    }

    setForm({
      client_id: project.client_id,
      project_name: project.project_name,
      project_code: project.project_code,
      location: project.location ?? "",
      start_date: project.start_date ? project.start_date.split("T")[0] : "",
      end_date: project.end_date ? project.end_date.split("T")[0] : "",
      status: project.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...form,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        client_id: Number(form.client_id),
      };

      if (selectedProject) {
        await apiRequest<Project>(`/projects/${selectedProject.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Site / Work Order updated successfully.");
      } else {
        await apiRequest<Project>("/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Site / Work Order created successfully.");
      }

      selectProject(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project");
    } finally {
      setIsSaving(false);
    }
  }

  const activeClients = clients.filter(c => c.status === "ACTIVE" || c.id === form.client_id);

  return (
    <AppShell
      title="Site / Work Order Master"
      allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}
    >
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Site / Work Orders</CardTitle>
            <CardDescription>
              Site / Work Order records associated with the tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading projects...</p>
            ) : (
              <div className="border border-[#E5E5E5] rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white uppercase bg-[#354A5F] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Site / Work Order</th>
                      <th className="px-4 py-2 font-semibold">Code</th>
                      <th className="px-4 py-2 font-semibold">Client</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b border-[#E5E5E5] hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-900">{project.project_name}</td>
                        <td className="px-4 py-2 text-slate-600">{project.project_code}</td>
                        <td className="px-4 py-2 text-slate-600">{project.client?.client_name ?? "Unknown"}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{heading}</CardTitle>
            <CardDescription>
              Create or update a project record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field label="Client">
                <select
                  required
                  className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                  value={form.client_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, client_id: Number(event.target.value) }))
                  }
                >
                  <option value={0} disabled>Select Client</option>
                  {activeClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.client_name} ({c.client_code})</option>
                  ))}
                </select>
              </Field>
              <Field label="Site / Work Order Name">
                <Input
                  required
                  value={form.project_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, project_name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Site / Work Order Code">
                <Input
                  required
                  value={form.project_code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, project_code: event.target.value }))
                  }
                />
              </Field>
              <Field label="Location">
                <Input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </Field>
              <Field label="Start Date">
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, start_date: event.target.value }))
                  }
                />
              </Field>
              <Field label="End Date">
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, end_date: event.target.value }))
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>

              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : selectedProject ? "Update Site / Work Order" : "Create Site / Work Order"}
                </Button>
                <Button variant="outline" onClick={() => selectProject(null)} type="button">
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
