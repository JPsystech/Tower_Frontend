"use client";

import { Building2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string; detail?: string };
        throw new Error(payload.message ?? payload.detail ?? "Unable to login");
      }

      setPassword("");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#1e293b_40%,#e2e8f0_100%)] px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_420px]">
        <div className="hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl backdrop-blur lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            TowerPro
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight">
            Digital Tower Inspection & Punch Closure Platform
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
            Phase 1 establishes secure login, tenant isolation, user administration,
            role control, and the operational dashboard foundation for the platform.
          </p>

          <div className="mt-10 grid gap-2">
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="JWT + role-aware access"
              description="Local development auth flow with tenant-scoped access rules."
            />
            <Feature
              icon={<Building2 className="h-5 w-5" />}
              title="Multi-tenant admin foundation"
              description="Tenant master, user master, role assignment, and audit-ready actions."
            />
          </div>
        </div>

        <Card className="self-center border-white/60 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Login</CardTitle>
            <CardDescription>
              Use one of the seeded users to enter the TowerPro admin console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
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

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 text-indigo-300">
        {icon}
        <p className="font-medium text-white">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
