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

export type TowerType = {
  id: number;
  tenant_id: number;
  type_name: string;
  type_code: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  type_name: "",
  type_code: "",
  description: "",
  status: "ACTIVE",
};

export function TowerTypeManagement() {
  const [towerTypes, setTowerTypes] = useState<TowerType[]>([]);
  const [selected, setSelected] = useState<TowerType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const heading = useMemo(() => (selected ? "Edit Tower Type" : "Create Tower Type"), [selected]);

  async function load() {
    try {
      setIsLoading(true);
      const result = await apiRequest<TowerType[]>("/tower-types");
      setTowerTypes(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tower types");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function selectItem(item: TowerType | null) {
    setSelected(item);
    setMessage(null);
    setError(null);
    if (!item) { setForm(emptyForm); return; }
    setForm({
      type_name: item.type_name,
      type_code: item.type_code,
      description: item.description ?? "",
      status: item.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      if (selected) {
        await apiRequest<TowerType>(`/tower-types/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setMessage("Tower type updated successfully.");
      } else {
        await apiRequest<TowerType>("/tower-types", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMessage("Tower type created successfully.");
      }
      selectItem(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save tower type");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Tower Type Master" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tower Types</CardTitle>
            <CardDescription>Classify towers by structural type for this tenant.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading tower types...</p>
            ) : (
              <div className="border border-[#E5E5E5] rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white uppercase bg-[#354A5F] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Name</th>
                      <th className="px-4 py-2 font-semibold">Code</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {towerTypes.map((tt) => (
                      <tr key={tt.id} className="border-b border-[#E5E5E5] hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-900">{tt.type_name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-600">{tt.type_code}</td>
                        <td className="px-4 py-2 text-slate-500">{tt.description ?? "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${tt.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
                            {tt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {towerTypes.length === 0 && (
                      <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-400">No tower types yet. Create one to get started.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{heading}</CardTitle>
            <CardDescription>Define a structural classification for towers in this tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field label="Type Name">
                <Input required value={form.type_name}
                  onChange={(e) => setForm((c) => ({ ...c, type_name: e.target.value }))} />
              </Field>
              <Field label="Type Code">
                <Input required value={form.type_code}
                  onChange={(e) => setForm((c) => ({ ...c, type_code: e.target.value }))} />
              </Field>
              <Field label="Description">
                <Input value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
              </Field>
              <Field label="Status">
                <select
                  className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
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
                  {isSaving ? "Saving..." : selected ? "Update Type" : "Create Type"}
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
