"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";

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
import type { TowerType } from "@/components/admin/tower-type-management";

export type ChecklistTemplate = {
  id: number;
  tenant_id: number;
  template_name: string;
  template_code: string;
  description: string | null;
  tower_type_id: number;
  inspection_type: string;
  version: string;
  status: string;
  created_at: string;
  updated_at: string;
  tower_type?: TowerType;
};

const INSPECTION_TYPES = ["FIRST_INSPECTION", "REINSPECTION", "FINAL_VERIFICATION"];

const emptyForm = {
  template_name: "",
  template_code: "",
  description: "",
  tower_type_id: 0,
  inspection_type: "FIRST_INSPECTION",
  version: "1.0",
  status: "ACTIVE",
};

export function ChecklistTemplateManagement() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [towerTypes, setTowerTypes] = useState<TowerType[]>([]);
  const [selected, setSelected] = useState<ChecklistTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const heading = useMemo(() => (selected ? "Edit Template" : "Create Template"), [selected]);

  const activeTowerTypes = useMemo(
    () => towerTypes.filter((t) => t.status === "ACTIVE" || t.id === Number(form.tower_type_id)),
    [towerTypes, form.tower_type_id],
  );

  async function loadAll() {
    try {
      setIsLoading(true);
      const [templatesRes, ttRes] = await Promise.all([
        apiRequest<ChecklistTemplate[]>("/checklist-templates"),
        apiRequest<TowerType[]>("/tower-types"),
      ]);
      setTemplates(templatesRes);
      setTowerTypes(ttRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  function selectItem(template: ChecklistTemplate | null) {
    setSelected(template);
    setMessage(null);
    setError(null);
    if (!template) { setForm(emptyForm); return; }
    setForm({
      template_name: template.template_name,
      template_code: template.template_code,
      description: template.description ?? "",
      tower_type_id: template.tower_type_id,
      inspection_type: template.inspection_type,
      version: template.version,
      status: template.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      ...form,
      tower_type_id: Number(form.tower_type_id),
      description: form.description || null,
    };

    try {
      if (selected) {
        await apiRequest<ChecklistTemplate>(`/checklist-templates/${selected.id}`, { method: "PUT", body: JSON.stringify(payload) });
        setMessage("Template updated successfully.");
      } else {
        await apiRequest<ChecklistTemplate>("/checklist-templates", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Template created successfully.");
      }
      selectItem(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save template");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Checklist Template Master" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Checklist Templates</CardTitle>
            <CardDescription>Manage inspection templates and link to the builder.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading templates...</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Template Name</th>
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Tower Type</th>
                    <th className="py-3 pr-4">Insp. Type</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{t.template_name}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{t.template_code}</td>
                      <td className="py-3 pr-4 text-slate-500">{t.tower_type?.type_code ?? "—"}</td>
                      <td className="py-3 pr-4 text-slate-500">{t.inspection_type}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/checklist-templates/${t.id}/builder`}>
                          <Button variant="outline" size="sm" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">Open Builder</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-sm text-slate-400">No templates found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{heading}</CardTitle>
            <CardDescription>Define a new template. Items and sections are managed in the Builder.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field label="Template Name">
                <Input required value={form.template_name} onChange={(e) => setForm((c) => ({ ...c, template_name: e.target.value }))} />
              </Field>
              <Field label="Template Code">
                <Input required value={form.template_code} onChange={(e) => setForm((c) => ({ ...c, template_code: e.target.value }))} />
              </Field>
              <Field label="Tower Type">
                <select
                  required
                  className="h-10 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm"
                  value={form.tower_type_id}
                  onChange={(e) => setForm((c) => ({ ...c, tower_type_id: Number(e.target.value) }))}
                >
                  <option value={0} disabled>Select Tower Type</option>
                  {activeTowerTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.type_name} ({t.type_code})</option>
                  ))}
                </select>
              </Field>
              <Field label="Inspection Type">
                <select
                  className="h-10 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm"
                  value={form.inspection_type}
                  onChange={(e) => setForm((c) => ({ ...c, inspection_type: e.target.value }))}
                >
                  {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Version">
                <Input required value={form.version} onChange={(e) => setForm((c) => ({ ...c, version: e.target.value }))} />
              </Field>
              <Field label="Description">
                <Input value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
              </Field>
              <Field label="Status">
                <select
                  className="h-10 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>

              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : selected ? "Update" : "Create"}
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
