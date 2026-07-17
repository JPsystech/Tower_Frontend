"use client";

import { useEffect, useState } from "react";

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
import { apiRequest } from "@/lib/api";
import type { Role, User } from "@/lib/types";

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);
      const [roleResult, userResult] = await Promise.all([
        apiRequest<Role[]>("/roles"),
        apiRequest<User[]>("/users"),
      ]);
      setRoles(roleResult);
      setUsers(userResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load roles");
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

  const selectedUser = users.find((item) => item.id === Number(selectedUserId)) ?? null;

  function handleUserChange(userId: string) {
    setSelectedUserId(userId);
    setMessage(null);
    setError(null);

    const user = users.find((item) => item.id === Number(userId));
    if (!user) {
      setSelectedRoles([]);
      return;
    }

    setSelectedRoles(
      roles.filter((role) => user.roles.includes(role.name)).map((role) => role.id),
    );
  }

  function toggleRole(roleId: number) {
    setSelectedRoles((current) =>
      current.includes(roleId)
        ? current.filter((item) => item !== roleId)
        : [...current, roleId],
    );
  }

  async function assignRoles() {
    if (!selectedUser) {
      setError("Select a user before assigning roles.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      setError(null);
      await apiRequest<User>(`/users/${selectedUser.id}/roles`, {
        method: "POST",
        body: JSON.stringify({ role_ids: selectedRoles }),
      });
      setMessage("Role assignment saved successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign roles");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Roles & Assignment"
      allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}
    >
      <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Available Roles</CardTitle>
            <CardDescription>
              Phase 1 predefined roles used for access control and tenant scoping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading roles...</p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-sm border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-slate-900">{role.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {role.description ?? "No description"}
                      </p>
                    </div>
                    <Badge>{role.name}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Roles</CardTitle>
            <CardDescription>
              Replace the selected user&apos;s role set in one action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Select User</span>
              <select
                className="h-10 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm"
                value={selectedUserId}
                onChange={(event) => handleUserChange(event.target.value)}
              >
                <option value="">Choose a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 rounded-sm border border-slate-200 px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span className="font-medium text-slate-800">{role.name}</span>
                </label>
              ))}
            </div>

            {selectedUser ? (
              <div className="rounded-sm bg-slate-50 p-2 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{selectedUser.full_name}</p>
                <p className="mt-1">Current roles: {selectedUser.roles.join(", ") || "None"}</p>
              </div>
            ) : null}

            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button onClick={assignRoles} disabled={isSaving || !selectedUserId}>
              {isSaving ? "Saving..." : "Assign Roles"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
