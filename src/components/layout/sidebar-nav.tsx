"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, CheckSquare, ClipboardList, LayoutDashboard, Users, Wrench, Activity, AlertTriangle, FileText, History, BarChart3, Settings, ShieldCheck, Briefcase
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SessionPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

const superAdminModules = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants (Vendors)", icon: Building2 },
  { href: "/admin/users", label: "Global Users", icon: Users },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: History },
  { href: "/admin/settings", label: "Global Settings", icon: Settings },
];

const tenantAdminModules = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/site-setup", label: "Site Setup Wizard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/projects", label: "Site / Work Orders", icon: ClipboardList },
  { href: "/admin/engineers", label: "Engineer Master", icon: Briefcase },
  { href: "/admin/tower-types", label: "Tower Types", icon: Building2 },
  { href: "/admin/towers", label: "Tower Master", icon: Wrench },
  { href: "/admin/inspection-jobs", label: "Inspection Jobs", icon: Activity },
  { href: "/admin/punch-points", label: "Punch Points", icon: AlertTriangle },
  { href: "/admin/reinspections", label: "Reinspections", icon: CheckSquare },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/report-templates", label: "Report Templates", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const engineerModules = [
  { href: "/engineer/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/engineer/inspection-jobs", label: "My Inspections", icon: Activity },
  { href: "/engineer/punch-points", label: "My Punch Points", icon: AlertTriangle },
  { href: "/engineer/reinspections", label: "My Reinspections", icon: CheckSquare },
  { href: "/engineer/reports", label: "My Reports", icon: FileText },
  { href: "/profile/settings", label: "My Profile", icon: Settings },
];

const clientModules = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/towers", label: "Their Towers", icon: Building2 },
  { href: "/client/inspections", label: "Inspection Status", icon: Activity },
  { href: "/client/punch-points", label: "Punch Points", icon: AlertTriangle },
  { href: "/client/reports", label: "Reports", icon: FileText },
];

type SidebarNavProps = {
  session: SessionPayload;
};

export function SidebarNav({ session }: SidebarNavProps) {
  const pathname = usePathname();

  let activeModules: Array<{ href: string, label: string, icon: any, children?: any[] }> = [];
  if (session.roles.includes("SUPER_ADMIN")) {
    activeModules = superAdminModules;
  } else if (session.roles.includes("TENANT_ADMIN") || session.roles.includes("ADMIN")) {
    activeModules = tenantAdminModules;
  } else if (session.roles.includes("ENGINEER")) {
    activeModules = engineerModules;
  } else if (session.roles.includes("CLIENT")) {
    activeModules = clientModules;
  }

  // Deduplicate array if double settings exist
  const uniqueModules = activeModules.filter((v,i,a)=>a.findIndex(v2=>(v2.href===v.href))===i)

  return (
    <nav className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col space-y-0.5 overflow-y-auto">
      <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-[#E5E5E5]">
        Navigation
      </div>
      {uniqueModules.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center px-4 py-2.5 text-sm font-medium transition-colors border-l-4",
              isActive
                ? "bg-[#F4F5F7] text-[#354A5F] border-[#0070F2]"
                : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-4 w-4 flex-shrink-0",
                isActive
                  ? "text-[#0070F2]"
                  : "text-slate-400 group-hover:text-slate-500"
              )}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
