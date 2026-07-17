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

export type Client = {
  id: number;
  tenant_id: number;
  client_name: string;
  client_code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  client_name: "",
  client_code: "",
  email: "",
  phone: "",
  address: "",
  contact_person: "",
  status: "ACTIVE",
};

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const heading = useMemo(
    () => (selectedClient ? "Edit Client" : "Create Client"),
    [selectedClient],
  );

  async function loadClients() {
    try {
      setIsLoading(true);
      const result = await apiRequest<Client[]>("/clients");
      setClients(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load clients");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function initialize() {
      await loadClients();
    }

    void initialize();
  }, []);

  function selectClient(client: Client | null) {
    setSelectedClient(client);
    setMessage(null);
    setError(null);
    if (!client) {
      setForm(emptyForm);
      return;
    }

    setForm({
      client_name: client.client_name,
      client_code: client.client_code,
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
      contact_person: client.contact_person ?? "",
      status: client.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (selectedClient) {
        await apiRequest<Client>(`/clients/${selectedClient.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setMessage("Client updated successfully.");
      } else {
        await apiRequest<Client>("/clients", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMessage("Client created successfully.");
      }

      selectClient(null);
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save client");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Client Master"
      allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}
    >
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Client records associated with the tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading clients...</p>
            ) : (
              <div className="border border-[#E5E5E5] rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white uppercase bg-[#354A5F] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Name</th>
                      <th className="px-4 py-2 font-semibold">Code</th>
                      <th className="px-4 py-2 font-semibold">Contact</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b border-[#E5E5E5] hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-900">{client.client_name}</td>
                        <td className="px-4 py-2 text-slate-600">{client.client_code}</td>
                        <td className="px-4 py-2 text-slate-600">{client.contact_person}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                            {client.status}
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
              Create or update a client record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field label="Client Name">
                <Input
                  required
                  value={form.client_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, client_name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Client Code">
                <Input
                  required
                  value={form.client_code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, client_code: event.target.value }))
                  }
                />
              </Field>
              <Field label="Email">
                <Input
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
              <Field label="Contact Person">
                <Input
                  value={form.contact_person}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact_person: event.target.value }))
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
                  {isSaving ? "Saving..." : selectedClient ? "Update Client" : "Create Client"}
                </Button>
                <Button variant="outline" onClick={() => selectClient(null)} type="button">
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
