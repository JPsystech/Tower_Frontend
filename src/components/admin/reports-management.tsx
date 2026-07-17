"use client";

import { useEffect, useState } from "react";
import { getReports, generateFirstInspectionReport, generatePunchPointReport } from "@/lib/api";
import { useSession } from "@/lib/use-session";
import { AppShell } from "@/components/layout/app-shell";
import { Download, FileText } from "lucide-react";

export function ReportsManagement() {
  const { session } = useSession();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleId, setCycleId] = useState("");

  const load = async () => {
    if (!session) return;
    try {
      const res = await getReports(session.access_token);
      setReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session]);

  const handleGenFI = async () => {
    if (!cycleId || !session) return alert("Enter Cycle ID");
    try {
      await generateFirstInspectionReport(Number(cycleId), session.access_token);
      alert("First Inspection Report generated");
      load();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleGenPP = async () => {
    if (!cycleId || !session) return alert("Enter Cycle ID");
    try {
      await generatePunchPointReport(Number(cycleId), session.access_token);
      alert("Punch Point Report generated");
      load();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <AppShell title="Reports">
      {loading ? (
        <div>Loading reports...</div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Cycle ID"
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 text-sm text-black"
              />
              <button onClick={handleGenFI} className="bg-indigo-600 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-indigo-700">
                Gen FI Report
              </button>
              <button onClick={handleGenPP} className="bg-blue-600 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-blue-700">
                Gen PP Report
              </button>
            </div>
          </div>
          
          <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Report No</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Generated At</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{r.report_no}</td>
                    <td className="px-6 py-4">{r.title}</td>
                    <td className="px-6 py-4">{r.report_type}</td>
                    <td className="px-6 py-4">{new Date(r.generated_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`http://127.0.0.1:8000${r.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No reports generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
