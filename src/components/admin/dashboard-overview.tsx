import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    label: "Total Towers",
    value: "128",
    description: "Static count for foundation phase",
    icon: Building2,
  },
  {
    label: "Pending Inspections",
    value: "24",
    description: "Static count for upcoming inspection module",
    icon: ClipboardList,
  },
  {
    label: "Open Punch Points",
    value: "17",
    description: "Static count for future punch closure tracking",
    icon: AlertTriangle,
  },
  {
    label: "Completed Towers",
    value: "92",
    description: "Static count for dashboard preview",
    icon: CheckCircle2,
  },
];

export function DashboardOverview() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-3 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardDescription>{card.label}</CardDescription>
                    <CardTitle className="mt-3 text-xl">{card.value}</CardTitle>
                  </div>
                  <div className="rounded-sm bg-indigo-50 p-3 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Phase 1 Scope</CardTitle>
            <CardDescription>
              Only the foundation modules are active in this build.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Working now: Login, Tenants, Users, Roles, Role Assignment, Dashboard, Audit Logging.</p>
            <p>
              Deferred modules stay visible in navigation so the product roadmap is
              clear, but each is intentionally marked Coming Soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
