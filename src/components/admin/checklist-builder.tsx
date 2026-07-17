"use client";

import { useEffect, useState, useMemo } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import type { ChecklistTemplate } from "./checklist-template-management";

type ChecklistSection = {
  id: number;
  tenant_id: number;
  checklist_template_id: number;
  section_name: string;
  section_code: string;
  section_order: number;
  status: string;
};

type ChecklistItem = {
  id: number;
  tenant_id: number;
  checklist_template_id: number;
  checklist_section_id: number;
  item_text: string;
  item_code: string;
  item_order: number;
  answer_type: string;
  is_photo_required: boolean;
  min_photos: number;
  max_photos: number;
  is_remark_required: boolean;
  remark_required_on_fail: boolean;
  is_measurement_required: boolean;
  measurement_unit: string | null;
  creates_punch_on_fail: boolean;
  default_severity: string | null;
  is_reinspection_required: boolean;
  component_type?: string | null;
  expected_qty?: number | null;
  status: string;
};

const ANSWER_TYPES = ["PASS_FAIL_NA", "TEXT", "NUMBER", "MEASUREMENT", "DROPDOWN"];
const SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"];

export function ChecklistBuilder({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Section Form state
  const emptySectionForm = { section_name: "", section_code: "", section_order: "", status: "ACTIVE" };
  const [sectionForm, setSectionForm] = useState(emptySectionForm);
  const [selectedSection, setSelectedSection] = useState<ChecklistSection | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

  const STANDARD_CHECKS = [
    { id: "leg", label: "Leg check with Drawing", component: "LEG" },
    { id: "diagonal", label: "Diagonal pcs check with Drawing", component: "DIAGONAL" },
    { id: "support", label: "Support Piece Check with Drawing", component: "SUPPORT" },
    { id: "nutbolt", label: "Nut Bolt & Washer check (Qty & Size)", component: "NUT_BOLT_WASHER" },
    { id: "rusting", label: "Rusting, Color, Zinc Coating Visual Check", component: "GENERAL" }
  ];

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ 
    total_sections: 15,
    faces: ["Face A", "Face B", "Face C"]
  });
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Item Form state
  const emptyItemForm = {
    checklist_section_id: 0,
    item_text: "",
    item_code: "",
    component_type: "",
    item_order: "",
    answer_type: "PASS_FAIL_NA",
    is_photo_required: false,
    min_photos: 0,
    max_photos: 0,
    is_remark_required: false,
    remark_required_on_fail: false,
    is_measurement_required: false,
    measurement_unit: "",
    creates_punch_on_fail: false,
    default_severity: "",
    is_reinspection_required: false,
    status: "ACTIVE",
    expected_qty: "" as number | "",
  };
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);
      const [tRes, sRes, iRes] = await Promise.all([
        apiRequest<ChecklistTemplate>(`/checklist-templates/${templateId}`),
        apiRequest<ChecklistSection[]>(`/checklist-sections?template_id=${templateId}`),
        apiRequest<ChecklistItem[]>(`/checklist-items?template_id=${templateId}`),
      ]);
      setTemplate(tRes);
      setSections(sRes.sort((a, b) => a.section_order - b.section_order));
      setItems(iRes.sort((a, b) => a.item_order - b.item_order));
      setError(null);
    } catch (err: any) {
      setError(`Checklist template not found or failed to load. Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, [templateId]);

  async function saveBulk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsBulkLoading(true);
    try {
      const payload = {
        total_sections: Number(bulkForm.total_sections),
        faces: bulkForm.faces
      };
      await apiRequest(`/checklist-templates/${templateId}/generate-full-tower`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await loadData();
      setIsBulkModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  }

  // Section Actions
  function openSectionModal(section?: ChecklistSection) {
    if (section) {
      setSelectedSection(section);
      setSectionForm({
        section_name: section.section_name,
        section_code: section.section_code,
        section_order: String(section.section_order),
        status: section.status,
      });
    } else {
      setSelectedSection(null);
      setSectionForm(emptySectionForm);
    }
    setError(null);
    setMessage(null);
    setIsSectionModalOpen(true);
  }

  async function saveSection(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      checklist_template_id: Number(templateId),
      section_name: sectionForm.section_name,
      section_code: sectionForm.section_code,
      section_order: Number(sectionForm.section_order),
      status: sectionForm.status,
    };
    try {
      if (selectedSection) {
        await apiRequest(`/checklist-sections/${selectedSection.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiRequest("/checklist-sections", { method: "POST", body: JSON.stringify(payload) });
      }
      setIsSectionModalOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section");
    }
  }

  async function deleteSection(id: number) {
    if (!confirm("Are you sure you want to delete this section? All items in it will also be deleted.")) return;
    try {
      await apiRequest(`/checklist-sections/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section");
    }
  }

  // Item Actions
  function openItemModal(sectionId: number, item?: ChecklistItem) {
    if (item) {
      setSelectedItem(item);
      setItemForm({
        checklist_section_id: item.checklist_section_id,
        item_text: item.item_text,
        item_code: item.item_code,
        component_type: item.component_type || "",
        item_order: String(item.item_order),
        answer_type: item.answer_type,
        is_photo_required: item.is_photo_required,
        min_photos: item.min_photos,
        max_photos: item.max_photos,
        is_remark_required: item.is_remark_required,
        remark_required_on_fail: item.remark_required_on_fail,
        is_measurement_required: item.is_measurement_required,
        measurement_unit: item.measurement_unit || "",
        creates_punch_on_fail: item.creates_punch_on_fail,
        default_severity: item.default_severity || "",
        is_reinspection_required: item.is_reinspection_required,
        status: item.status,
        expected_qty: item.expected_qty || "",
      });
    } else {
      setSelectedItem(null);
      setItemForm({ ...emptyItemForm, checklist_section_id: sectionId });
    }
    setError(null);
    setMessage(null);
    setIsItemModalOpen(true);
  }

  async function saveItem(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...itemForm,
      checklist_template_id: Number(templateId),
      item_order: Number(itemForm.item_order),
      min_photos: Number(itemForm.min_photos),
      max_photos: Number(itemForm.max_photos),
      measurement_unit: itemForm.measurement_unit || null,
      default_severity: itemForm.default_severity || null,
    };
    try {
      if (selectedItem) {
        await apiRequest(`/checklist-items/${selectedItem.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiRequest("/checklist-items", { method: "POST", body: JSON.stringify(payload) });
      }
      setIsItemModalOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await apiRequest(`/checklist-items/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  async function bulkDeleteItems() {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) return;
    try {
      await apiRequest(`/checklist-items/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ ids: selectedItems })
      });
      setSelectedItems([]);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bulk delete items");
    }
  }

  async function bulkDeleteSections() {
    if (!confirm(`Are you sure you want to delete ${selectedSections.length} selected sections? All items inside them will also be deleted.`)) return;
    try {
      await apiRequest(`/checklist-sections/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ ids: selectedSections })
      });
      setSelectedSections([]);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bulk delete sections");
    }
  }

  if (isLoading) return <AppShell title="Checklist Builder" allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}><p>Loading...</p></AppShell>;

  const builderTitle = template ? `Checklist Builder: ${template.template_name}` : "Checklist Builder";

  return (
    <AppShell title={builderTitle} allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"]}>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/checklist-templates">
          <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        </Link>
      </div>

      {template && (
        <div className="flex justify-between items-center bg-white p-4 rounded-sm shadow-sm border mb-4">
          <div>
            <h2 className="font-bold text-lg">{template.template_name} ({template.template_code})</h2>
            <p className="text-sm text-slate-500">
              Tower Type: {template.tower_type?.type_name} | Inspection Type: {template.inspection_type} | Version: {template.version} | Status: {template.status}
            </p>
          </div>
          <div className="flex space-x-2">
            {selectedSections.length > 0 && (
              <Button onClick={bulkDeleteSections} className="bg-red-600 text-white hover:bg-red-700 hover:text-white">
                🗑️ Delete Selected Sections ({selectedSections.length})
              </Button>
            )}
            {selectedItems.length > 0 && (
              <Button onClick={bulkDeleteItems} className="bg-red-600 text-white hover:bg-red-700 hover:text-white">
                🗑️ Delete Selected Items ({selectedItems.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} disabled={!template}>
              🏗️ Generate Full Tower
            </Button>
            <Button onClick={() => openSectionModal()} disabled={!template}>
              <Plus className="h-4 w-4 mr-2" /> Add Section
            </Button>
          </div>
        </div>
      )}

      {error && <div className="mb-6 rounded-sm bg-rose-50 p-2 text-rose-600 font-medium">{error}</div>}

      <div className="space-y-3">
        {sections.map(section => {
          const sectionItems = items.filter(i => i.checklist_section_id === section.id);
          return (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b pb-4">
                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 mt-1 w-4 h-4 cursor-pointer"
                    checked={selectedSections.includes(section.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSections(prev => [...prev, section.id]);
                      } else {
                        setSelectedSections(prev => prev.filter(id => id !== section.id));
                      }
                    }}
                  />
                  <div>
                    <CardTitle className="text-sm">{section.section_order}. {section.section_name}</CardTitle>
                    <CardDescription>Code: {section.section_code} | Status: {section.status}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => openSectionModal(section)}>
                  ✏️ Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteSection(section.id)}>
                  🗑️ Delete
                </Button>
                <Button size="sm" onClick={() => openItemModal(section.id)} disabled={!template}>Add Item</Button>
              </div>
              </CardHeader>
              <CardContent className="pt-4">
                {sectionItems.length === 0 ? (
                  <p className="text-sm text-slate-400">No items in this section.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="border-b">
                        <tr className="text-left text-slate-500">
                          <th className="pb-2 w-10">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300"
                              checked={sectionItems.length > 0 && sectionItems.every(i => selectedItems.includes(i.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems(prev => Array.from(new Set([...prev, ...sectionItems.map(i => i.id)])));
                                } else {
                                  setSelectedItems(prev => prev.filter(id => !sectionItems.find(i => i.id === id)));
                                }
                              }}
                            />
                          </th>
                          <th className="pb-2">Order</th>
                          <th className="pb-2">Code</th>
                          <th className="pb-2">Component</th>
                          <th className="pb-2">Text</th>
                        <th className="pb-2">Answer Type</th>
                        <th className="pb-2">Rules</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionItems.map(item => (
                          <tr key={item.id} className={`border-b last:border-0 hover:bg-slate-50 ${selectedItems.includes(item.id) ? 'bg-blue-50/50' : ''}`}>
                            <td className="py-2">
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-300"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(prev => [...prev, item.id]);
                                  } else {
                                    setSelectedItems(prev => prev.filter(id => id !== item.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-2">{item.item_order}</td>
                            <td className="py-2 font-mono text-xs">{item.item_code}</td>
                            <td className="py-2">
                              {item.component_type && (
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                  {item.component_type} {item.expected_qty ? `(Qty: ${item.expected_qty})` : ''}
                                </span>
                              )}
                            </td>
                            <td className="py-2 max-w-xs truncate">{item.item_text}</td>
                          <td className="py-2">{item.answer_type}</td>
                          <td className="py-2 text-xs text-slate-500 space-y-1">
                            {item.is_photo_required && <div>Photos: {item.min_photos}-{item.max_photos}</div>}
                            {item.answer_type === "MEASUREMENT" && <div>Unit: {item.measurement_unit}</div>}
                            {item.creates_punch_on_fail && <div className="text-amber-600">Punch: {item.default_severity}</div>}
                          </td>
                          <td className="py-2 text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => openItemModal(section.id, item)}>
                                    Edit
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteItem(item.id)}>
                                    Delete
                                  </Button>
                                </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          );
        })}
        {sections.length === 0 && (
          <div className="text-center py-12 text-slate-500 border rounded-sm bg-white">
            No sections created yet. Click "Add Section" to begin.
          </div>
        )}
      </div>

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-10">
          <div className="w-full max-w-lg rounded-sm bg-white p-4 shadow-xl my-4">
            <h3 className="mb-4 text-sm font-bold">🏗️ Generate Full Tower</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will automatically create 1 Foundation section, followed by all sections and faces with Leg, Diagonal, and Support checks.
            </p>
            <form onSubmit={saveBulk} className="space-y-4">
              <Field label="Total Sections">
                <Input type="number" required min="1" value={bulkForm.total_sections} onChange={e => setBulkForm(b => ({...b, total_sections: Number(e.target.value)}))} />
              </Field>
              <Field label="Faces (comma separated)">
                <Input required value={bulkForm.faces.join(", ")} onChange={e => setBulkForm(b => ({...b, faces: e.target.value.split(",").map(s => s.trim()).filter(Boolean)}))} />
              </Field>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isBulkLoading}>
                  {isBulkLoading ? "Generating..." : "Generate Tower Template"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-sm bg-white p-3 shadow-xl">
            <h3 className="mb-4 text-sm font-bold">{selectedSection ? "Edit Section" : "Add Section"}</h3>
            <form onSubmit={saveSection} className="space-y-2">
              <Field label="Section Name"><Input required value={sectionForm.section_name} onChange={e => setSectionForm(s => ({ ...s, section_name: e.target.value }))} /></Field>
              <Field label="Section Code"><Input required value={sectionForm.section_code} onChange={e => setSectionForm(s => ({ ...s, section_code: e.target.value }))} /></Field>
              <Field label="Section Order"><Input type="number" required value={sectionForm.section_order} onChange={e => setSectionForm(s => ({ ...s, section_order: e.target.value }))} /></Field>
              <Field label="Status">
                <select className="h-10 w-full rounded-sm border bg-white px-3" value={sectionForm.status} onChange={e => setSectionForm(s => ({ ...s, status: e.target.value }))}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsSectionModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-sm bg-white p-3 shadow-xl my-8">
            <h3 className="mb-4 text-sm font-bold">{selectedItem ? "Edit Item" : "Add Item"}</h3>
            <form onSubmit={saveItem} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Item Code"><Input required value={itemForm.item_code} onChange={e => setItemForm(s => ({ ...s, item_code: e.target.value }))} /></Field>
                <Field label="Item Order"><Input type="number" required value={itemForm.item_order} onChange={e => setItemForm(s => ({ ...s, item_order: e.target.value }))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Component Type">
                  <select className="h-10 w-full rounded-sm border bg-white px-3" value={itemForm.component_type} onChange={e => setItemForm(s => ({ ...s, component_type: e.target.value }))}>
                    <option value="">None</option>
                    <option value="LEG">Leg</option>
                    <option value="DIAGONAL">Diagonal</option>
                    <option value="SUPPORT">Support</option>
                    <option value="NUT_BOLT_WASHER">Nut/Bolt/Washer</option>
                    <option value="FOUNDATION">Foundation</option>
                    <option value="GENERAL">General</option>
                  </select>
                </Field>
                <Field label="Item Text"><Input required value={itemForm.item_text} onChange={e => setItemForm(s => ({ ...s, item_text: e.target.value }))} /></Field>
              </div>
              
              <div className="grid grid-cols-3 gap-2 border-t pt-4">
                  <Field label="Answer Type">
                    <select required className="h-10 w-full rounded-sm border bg-white px-3" value={itemForm.answer_type} onChange={e => setItemForm(s => ({ ...s, answer_type: e.target.value }))}>
                      {ANSWER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Expected Qty (optional)">
                    <Input type="number" min="1" value={itemForm.expected_qty} onChange={e => setItemForm(s => ({ ...s, expected_qty: e.target.value ? Number(e.target.value) : "" }))} />
                  </Field>
                  {itemForm.answer_type === "MEASUREMENT" && (
                    <Field label="Unit"><Input required value={itemForm.measurement_unit} onChange={e => setItemForm(s => ({ ...s, measurement_unit: e.target.value }))} /></Field>
                  )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t pt-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={itemForm.is_photo_required} onChange={e => setItemForm(s => ({ ...s, is_photo_required: e.target.checked }))} />
                    Photo Required
                  </label>
                  {itemForm.is_photo_required && (
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Min" required value={itemForm.min_photos} onChange={e => setItemForm(s => ({ ...s, min_photos: Number(e.target.value) }))} />
                      <Input type="number" placeholder="Max" required value={itemForm.max_photos} onChange={e => setItemForm(s => ({ ...s, max_photos: Number(e.target.value) }))} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={itemForm.creates_punch_on_fail} onChange={e => setItemForm(s => ({ ...s, creates_punch_on_fail: e.target.checked }))} />
                    Creates Punch on Fail
                  </label>
                  {itemForm.creates_punch_on_fail && (
                    <select required className="h-10 w-full rounded-sm border bg-white px-3 text-sm" value={itemForm.default_severity} onChange={e => setItemForm(s => ({ ...s, default_severity: e.target.value }))}>
                      <option value="" disabled>Select Severity</option>
                      {SEVERITIES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <Field label="Status">
                    <select className="h-10 w-full rounded-sm border bg-white px-3" value={itemForm.status} onChange={e => setItemForm(s => ({ ...s, status: e.target.value }))}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
