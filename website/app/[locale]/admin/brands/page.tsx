"use client";

import { useState } from "react";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import {
  useAdminBrands,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
  type AdminBrand,
} from "@/hooks/use-admin-catalog";
import { ConfirmModal } from "../_components/confirm-modal";

export default function AdminBrandsPage() {
  const { data: brands = [], isLoading: loading } = useAdminBrands();
  const createMutation = useCreateBrand();
  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const updateMutation = useUpdateBrand(editing?.id || "");
  const deleteMutation = useDeleteBrand();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", logo: "", website: "", sort_order: 0 });
  const [deleting, setDeleting] = useState<AdminBrand | null>(null);

  function startEdit(brand: AdminBrand) {
    setEditing(brand);
    setFormData({ name: brand.name, description: brand.description, logo: brand.logo, website: brand.website, sort_order: brand.sort_order });
    setShowForm(true);
  }

  function startCreate() {
    setEditing(null);
    setFormData({ name: "", description: "", logo: "", website: "", sort_order: brands.length });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.danger("Name required");
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
      setShowForm(false);
      toast.success(editing ? "Updated" : "Created");
    } catch {
      toast.danger("Save failed");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Brand removed");
    } catch {
      toast.danger("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const labelStyle = { fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" as const, color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, display: "block" as const, marginBottom: "var(--space-2)" };
  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", width: "100%" };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>Brands</h1>
        <button onClick={startCreate} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}><Plus size={14} />Add Brand</button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>{editing ? "Edit Brand" : "New Brand"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label style={labelStyle}>Name *</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Logo URL</label><input value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Website</label><input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Sort Order</label><input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} style={inputStyle} /></div>
            <div className="md:col-span-2"><label style={labelStyle}>Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={inputStyle} /></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleSave} className="rounded-md px-5 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} className="rounded-md px-5 py-2.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>
      ) : brands.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <Tag size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>No brands yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {brands.map((b, i) => (
            <div key={b.id} className="flex items-center justify-between" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < brands.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>{b.name}{!b.is_active && <span className="ml-2 text-xs" style={{ color: "var(--error)" }}>(inactive)</span>}</p>
                {b.website && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>{b.website}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(b)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(187,148,41,0.1)]" style={{ color: "var(--white-faint)" }}><Pencil size={14} /></button>
                <button onClick={() => setDeleting(b)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(198,40,40,0.1)]" style={{ color: "var(--white-faint)" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={!!deleting} title="Remove Brand?" message={`This will deactivate "${deleting?.name}". Existing products will remain but the brand will be hidden.`} confirmLabel="Remove" destructive onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
