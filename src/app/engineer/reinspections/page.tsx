import { AppShell } from "@/components/layout/app-shell";

export default function PlaceholderPage() {
  return (
    <AppShell title="Module">
      <div className="bg-white p-4 rounded-sm border border-slate-300">
        <h2 className="text-sm font-semibold mb-2 text-slate-800">Module Under Construction</h2>
        <p className="text-xs text-slate-600">This dense, SAP-style module is currently being scaffolded.</p>
      </div>
    </AppShell>
  );
}
