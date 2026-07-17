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
import type { Tenant } from "@/lib/types";

const emptyForm = {
  company_name: "",
  company_code: "",
  email: "",
  phone: "",
  address: "",
  logo_url: "",
  status: "ACTIVE",
};

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const heading = useMemo(
    () => (selectedTenant ? "Edit Tenant" : "Create Tenant"),
    [selectedTenant],
  );

  async function loadTenants() {
    try {
      setIsLoading(true);
      const result = await apiRequest<Tenant[]>("/tenants");
      setTenants(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tenants");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function initialize() {
      await loadTenants();
    }

    void initialize();
  }, []);

  function selectTenant(tenant: Tenant | null) {
    setSelectedTenant(tenant);
    setMessage(null);
    setError(null);
    if (!tenant) {
      setForm(emptyForm);
      return;
    }

    setForm({
      company_name: tenant.company_name,
      company_code: tenant.company_code,
      email: tenant.email,
      phone: tenant.phone ?? "",
      address: tenant.address ?? "",
      logo_url: tenant.logo_url ?? "",
      status: tenant.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (selectedTenant) {
        await apiRequest<Tenant>(`/tenants/${selectedTenant.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setMessage("Tenant updated successfully.");
      } else {
        await apiRequest<Tenant>("/tenants", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMessage("Tenant created successfully.");
      }

      selectTenant(null);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save tenant");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Tenant Master"
      allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}
    >
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              Company master records with tenant-level isolation.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading tenants...</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Company</th>
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {tenant.company_name}
                      </td>
                      <td className="py-3 pr-4">{tenant.company_code}</td>
                      <td className="py-3 pr-4">{tenant.email}</td>
                      <td className="py-3 pr-4">{tenant.status}</td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectTenant(tenant)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{heading}</CardTitle>
            <CardDescription>
              Create or update a tenant record for TowerPro administration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field label="Company Name">
                <Input
                  required
                  value={form.company_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company_name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Company Code">
                <Input
                  required
                  value={form.company_code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company_code: event.target.value }))
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </Field>
              <Field label="Address">
                <Input
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </Field>
              <Field label="Logo URL">
                <Input
                  value={form.logo_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, logo_url: event.target.value }))
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  className="h-10 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm"
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
                  {isSaving ? "Saving..." : selectedTenant ? "Update Tenant" : "Create Tenant"}
                </Button>
                <Button variant="outline" onClick={() => selectTenant(null)}>
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
