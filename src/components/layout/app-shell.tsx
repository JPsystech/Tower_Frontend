"use client";

import type { ReactNode } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/use-session";

type AppShellProps = {
  title: string;
  children: ReactNode;
  allowedRoles?: string[];
};

export function AppShell({ title, children, allowedRoles }: AppShellProps) {
  const { session, isLoading, clearSession } = useSession();

  if (isLoading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-12 animate-pulse rounded bg-slate-200" />
              <div className="h-48 animate-pulse rounded bg-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthorized =
    !allowedRoles ||
    allowedRoles.some((role) => session.roles.includes(role));

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5f7] text-slate-900">
      <Topbar title={title} session={session} onLogout={clearSession} />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav session={session} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-w-0">
          {isAuthorized ? (
            children
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>
                  Your current role does not have access to this page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Continue using the dashboard with the permissions assigned to{" "}
                  {session.user.full_name}.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
