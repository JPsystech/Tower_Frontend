"use client";

import { useEffect, useState } from "react";
import { getTenantSettings, updateTenantSettings, uploadTenantBranding, getUserSettings, updateUserSettings, changePassword } from "@/lib/api";
import { useSession } from "@/lib/use-session";
import { AppShell } from "@/components/layout/app-shell";

export function SettingsManagement() {
  const { session } = useSession();
  const isEngineer = session?.roles?.includes("ENGINEER") && !session?.roles?.some((r) => ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"].includes(r));
  const [activeTab, setActiveTab] = useState(isEngineer ? "security" : "profile");
  
  const [tenant, setTenant] = useState<any>({});
  const [userSettings, setUserSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [passData, setPassData] = useState({ current_password: "", new_password: "", confirm_password: "" });

  const load = async () => {
    if (!session) return;
    try {
      if (!isEngineer) {
        const t = await getTenantSettings(session.access_token);
        setTenant(t);
      }
      const u = await getUserSettings(session.access_token);
      setUserSettings(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session, isEngineer]);

  const handleTenantSave = async () => {
    if (!session) return;
    try {
      await updateTenantSettings(tenant, session.access_token);
      alert("Tenant settings saved");
      load();
    } catch (e: any) { alert("Error: " + e.message); }
  };
  
  const handleUserSave = async () => {
    if (!session) return;
    try {
      await updateUserSettings(userSettings, session.access_token);
      alert("User preferences saved");
      load();
    } catch (e: any) { alert("Error: " + e.message); }
  };
  
  const handlePassSave = async () => {
    if (!session) return;
    if (passData.new_password !== passData.confirm_password) return alert("Passwords do not match");
    try {
      await changePassword({ current_password: passData.current_password, new_password: passData.new_password }, session.access_token);
      alert("Password changed");
      setPassData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e: any) { alert("Error: " + e.message); }
  };
  
  const handleUpload = async (type: string, e: any) => {
    if (!session) return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadTenantBranding(type, file, session.access_token);
      alert("Uploaded successfully");
      load();
    } catch (err: any) { alert("Upload error: " + err.message); }
  };

  const tabs = [];
  if (!isEngineer) {
    tabs.push({ id: "profile", label: "Company Profile" });
    tabs.push({ id: "branding", label: "Report Branding" });
  }
  tabs.push({ id: "preferences", label: "Preferences" });
  tabs.push({ id: "security", label: "Security" });

  return (
    <AppShell title="Settings">
      {loading ? (
        <div>Loading settings...</div>
      ) : (
        <div className="space-y-3">
          <div className="flex border-b border-slate-200">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 font-medium text-sm ${activeTab === t.id ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          <div className="bg-white p-3 rounded-sm border border-slate-200 text-black">
            {activeTab === "profile" && !isEngineer && (
              <div className="space-y-2 max-w-lg">
                <h2 className="text-sm font-semibold">Company Profile</h2>
                <div><label className="block text-sm">Company Name</label><input className="border w-full p-2 rounded" value={tenant.company_name || ""} onChange={e => setTenant({...tenant, company_name: e.target.value})} /></div>
                <div><label className="block text-sm">Company Code</label><input className="border w-full p-2 rounded" value={tenant.company_code || ""} onChange={e => setTenant({...tenant, company_code: e.target.value})} /></div>
                <div><label className="block text-sm">Email</label><input className="border w-full p-2 rounded" value={tenant.email || ""} onChange={e => setTenant({...tenant, email: e.target.value})} /></div>
                <div><label className="block text-sm">Phone</label><input className="border w-full p-2 rounded" value={tenant.phone || ""} onChange={e => setTenant({...tenant, phone: e.target.value})} /></div>
                <div><label className="block text-sm">Address</label><input className="border w-full p-2 rounded" value={tenant.address || ""} onChange={e => setTenant({...tenant, address: e.target.value})} /></div>
                <div><label className="block text-sm">Upload Logo</label><input type="file" accept="image/*" onChange={(e) => handleUpload("logo", e)} className="border w-full p-2 rounded" /></div>
                {tenant.logo_url && <img src={`http://127.0.0.1:8000${tenant.logo_url}`} className="h-16" alt="Logo" />}
                <button onClick={handleTenantSave} className="bg-indigo-600 text-white px-4 py-2 rounded">Save Company Profile</button>
              </div>
            )}
            
            {activeTab === "branding" && !isEngineer && (
              <div className="space-y-2 max-w-lg">
                <h2 className="text-sm font-semibold">Report Branding</h2>
                <div><label className="block text-sm">Report Footer Text</label><input className="border w-full p-2 rounded" value={tenant.report_footer_text || ""} onChange={e => setTenant({...tenant, report_footer_text: e.target.value})} /></div>
                <div><label className="block text-sm">Report Prefix</label><input className="border w-full p-2 rounded" value={tenant.report_prefix || ""} onChange={e => setTenant({...tenant, report_prefix: e.target.value})} /></div>
                <div><label className="block text-sm">Punch Prefix</label><input className="border w-full p-2 rounded" value={tenant.punch_prefix || ""} onChange={e => setTenant({...tenant, punch_prefix: e.target.value})} /></div>
                <div><label className="block text-sm">Inspection Prefix</label><input className="border w-full p-2 rounded" value={tenant.inspection_prefix || ""} onChange={e => setTenant({...tenant, inspection_prefix: e.target.value})} /></div>
                <div><label className="block text-sm">Upload Stamp</label><input type="file" accept="image/*" onChange={(e) => handleUpload("stamp", e)} className="border w-full p-2 rounded" /></div>
                {tenant.company_stamp_url && <img src={`http://127.0.0.1:8000${tenant.company_stamp_url}`} className="h-16" alt="Stamp" />}
                <div><label className="block text-sm">Upload Signature</label><input type="file" accept="image/*" onChange={(e) => handleUpload("signature", e)} className="border w-full p-2 rounded" /></div>
                {tenant.authorized_signature_url && <img src={`http://127.0.0.1:8000${tenant.authorized_signature_url}`} className="h-16" alt="Signature" />}
                <button onClick={handleTenantSave} className="bg-indigo-600 text-white px-4 py-2 rounded">Save Branding</button>
              </div>
            )}
            
            {activeTab === "preferences" && (
              <div className="space-y-2 max-w-lg">
                <h2 className="text-sm font-semibold">Preferences</h2>
                <div><label className="block text-sm">Timezone</label><input className="border w-full p-2 rounded" value={userSettings.default_timezone || "UTC"} disabled /></div>
                <div><label className="block text-sm">Theme</label>
                  <select className="border w-full p-2 rounded" value={userSettings.theme || "light"} onChange={e => setUserSettings({...userSettings, theme: e.target.value})}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div><label className="block text-sm">Notifications</label>
                  <input type="checkbox" checked={userSettings.notification_enabled !== false} onChange={e => setUserSettings({...userSettings, notification_enabled: e.target.checked})} />
                </div>
                <button onClick={handleUserSave} className="bg-indigo-600 text-white px-4 py-2 rounded">Save Preferences</button>
              </div>
            )}
            
            {activeTab === "security" && (
              <div className="space-y-2 max-w-lg">
                <h2 className="text-sm font-semibold">Security - Change Password</h2>
                <div><label className="block text-sm">Current Password</label><input type="password" placeholder="Current" className="border w-full p-2 rounded" value={passData.current_password} onChange={e => setPassData({...passData, current_password: e.target.value})} /></div>
                <div><label className="block text-sm">New Password</label><input type="password" placeholder="New" className="border w-full p-2 rounded" value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})} /></div>
                <div><label className="block text-sm">Confirm Password</label><input type="password" placeholder="Confirm" className="border w-full p-2 rounded" value={passData.confirm_password} onChange={e => setPassData({...passData, confirm_password: e.target.value})} /></div>
                <button onClick={handlePassSave} className="bg-indigo-600 text-white px-4 py-2 rounded">Change Password</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
