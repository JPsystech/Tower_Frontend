"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { useSession } from "@/lib/use-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EngineerManagement() {
  const { session } = useSession();
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    engineer_code: "",
    full_name: "",
    email: "",
    password: "",
    phone: "",
    discipline: "",
    designation: ""
  });

  const load = async () => {
    if (!session) return;
    try {
      const data = await apiRequest("/engineers");
      setEngineers(data as any[]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!session) return;
    try {
      if (editingId) {
        // We only send password if it's filled
        const payload: any = { ...form };
        if (!payload.password) {
          delete payload.password;
        }
        await apiRequest(`/engineers/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("Engineer updated");
      } else {
        await apiRequest("/engineers", {
          method: "POST",
          body: JSON.stringify(form)
        });
        alert("Engineer created");
      }
      
      handleReset();
      load();
    } catch (err: any) { alert(err.message || "An error occurred"); }
  };

  const handleEdit = (eng: any) => {
    setEditingId(eng.id);
    setForm({
      engineer_code: eng.engineer_code || "",
      full_name: eng.full_name || "",
      email: eng.email || "",
      password: "", // don't load password
      phone: eng.phone || "",
      discipline: eng.discipline || "",
      designation: eng.designation || ""
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setForm({
      engineer_code: "",
      full_name: "",
      email: "",
      password: "",
      phone: "",
      discipline: "",
      designation: ""
    });
  };

  return (
    <AppShell title="Engineer Master" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Form Card */}
        <Card className="lg:col-span-1 border border-[#E5E5E5] shadow-sm rounded-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-[#E5E5E5] py-3">
            <CardTitle className="text-sm font-semibold text-slate-800">{editingId ? 'Edit Engineer' : 'Create Engineer'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Code</label>
                <input required className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.engineer_code} onChange={e => setForm({...form, engineer_code: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input required className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                <input required type="email" className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password {editingId && <span className="text-slate-400 font-normal lowercase">(leave blank to keep)</span>}</label>
                <input required={!editingId} type="text" className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                <input className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Discipline</label>
                <input className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.discipline} onChange={e => setForm({...form, discipline: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
                <input className="flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] text-black" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} />
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button type="submit" className="flex-1 bg-[#0070F2] text-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-[#005CC8] transition-colors shadow-sm">
                  {editingId ? 'Update Engineer' : 'Save Engineer'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleReset} className="px-4 py-2 rounded-sm text-sm font-semibold border border-[#E5E5E5] text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Table Card */}
        <div className="lg:col-span-2 border border-[#E5E5E5] rounded-sm overflow-hidden bg-white shadow-sm self-start">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white uppercase bg-[#354A5F] border-b border-[#E5E5E5]">
              <tr>
                <th className="px-4 py-2 font-semibold">Code</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Designation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">Loading...</td></tr>
              ) : engineers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-500">No engineers found.</td>
                </tr>
              ) : (
                engineers.map(e => (
                  <tr key={e.id} className="border-b border-[#E5E5E5] hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-slate-900">{e.engineer_code}</td>
                    <td className="px-4 py-2">{e.full_name}</td>
                    <td className="px-4 py-2 text-slate-500">{e.email}</td>
                    <td className="px-4 py-2">{e.designation}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
