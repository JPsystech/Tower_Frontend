"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
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
import type { Tenant, User } from "@/lib/types";

const emptyForm = {
  tenant_id: "",
  full_name: "",
  email: "",
  phone: "",
  password: "",
  status: "ACTIVE",
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);
      const [userResult, tenantResult] = await Promise.all([
        apiRequest<User[]>("/users"),
        apiRequest<Tenant[]>("/tenants"),
      ]);
      setUsers(userResult);
      setTenants(tenantResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users");
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

  function selectUser(user: User | null) {
    setSelectedUser(user);
    setMessage(null);
    setError(null);
    if (!user) {
      setForm(emptyForm);
      return;
    }

    setForm({
      tenant_id: user.tenant_id ? String(user.tenant_id) : "",
      full_name: user.full_name,
      email: user.email,
      phone: user.phone ?? "",
      password: "",
      status: user.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      tenant_id: form.tenant_id ? Number(form.tenant_id) : null,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      status: form.status,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (selectedUser) {
        await apiRequest<User>(`/users/${selectedUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("User updated successfully.");
      } else {
        await apiRequest<User>("/users", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: form.password,
          }),
        });
        setMessage("User created successfully.");
      }

      selectUser(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save user");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="User Master"
      allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}
    >
      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage platform users and their tenant membership.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading users...</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Tenant</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Roles</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {user.full_name}
                      </td>
                      <td className="py-3 pr-4">
                        {user.tenant?.company_code ?? "GLOBAL"}
                      </td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map((role) => (
                            <Badge key={role}>{role}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{user.status}</td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => selectUser(user)}>
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
            <CardTitle>{selectedUser ? "Edit User" : "Create User"}</CardTitle>
            <CardDescription>
              Password is required on create and optional on update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <Field label="Tenant">
                <select
                  className="h-10 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm"
                  value={form.tenant_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tenant_id: event.target.value }))
                  }
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.company_name} ({tenant.company_code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Full Name">
                <Input
                  required
                  value={form.full_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, full_name: event.target.value }))
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
              <Field label={selectedUser ? "Reset Password" : "Password"}>
                <Input
                  required={!selectedUser}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
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
                  {isSaving ? "Saving..." : selectedUser ? "Update User" : "Create User"}
                </Button>
                <Button variant="outline" onClick={() => selectUser(null)}>
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
