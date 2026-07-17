import { AppShell } from "@/components/layout/app-shell";

export default function ClientPage() {
  return (
    <AppShell title="Client Panel" allowedRoles={["CLIENT"]}>
      <div className="bg-white p-3 rounded-sm border border-slate-200">
        <h2 className="text-sm font-semibold mb-4 text-black">Client Dashboard / View</h2>
        <p className="text-slate-600">This module is currently in read-only mode for clients.</p>
      </div>
    </AppShell>
  );
}
