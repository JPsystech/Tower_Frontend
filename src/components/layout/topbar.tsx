"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/types";
import { SESSION_COOKIE } from "@/lib/api";

type TopbarProps = {
  title: string;
  session: SessionPayload;
  onLogout: () => void;
};

export function Topbar({ title, session, onLogout }: TopbarProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    try {
      setIsSubmitting(true);
      document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
      await fetch("/api/session/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
      });
      onLogout();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <header className="flex flex-col gap-2 bg-[#354A5F] text-white px-6 py-3 lg:flex-row lg:items-center lg:justify-between shadow-sm z-10 sticky top-0">
      <div>
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">TowerPro ERP</p>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Badge className="border-[#0070F2] bg-[#0070F2] text-white font-medium rounded-sm">
          {session.tenant?.company_code ?? "GLOBAL"}
        </Badge>
        <div className="rounded-sm bg-[#2c3e50] border-none px-4 py-1.5 flex flex-col justify-center">
          <p className="text-sm font-medium text-white">
            {session.user.full_name}
          </p>
          <p className="text-xs text-slate-300">{session.roles.join(", ")}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isSubmitting}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
