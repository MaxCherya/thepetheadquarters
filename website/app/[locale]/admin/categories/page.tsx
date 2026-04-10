"use client";

import { useMemo, useState } from "react";
import { Plus, FolderTree, Pencil, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { toast } from "@heroui/react";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type AdminCategory,
} from "@/hooks/use-admin-catalog";
import { ConfirmModal } from "../_components/confirm-modal";

interface TreeNode {
  category: AdminCategory;
  children: TreeNode[];
}

function buildTree(categories: AdminCategory[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  categories.forEach((c) => map.set(c.id, { category: c, children: [] }));

  const roots: TreeNode[] = [];
  categories.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent && map.has(c.parent)) {
      map.get(c.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort siblings by sort_order
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.category.sort_order - b.category.sort_order);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading: loading } = useAdminCategories();
  const createMutation = useCreateCategory();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const updateMutation = useUpdateCategory(editing?.id || "");
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", parent_id: "", sort_order: 0 });
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(categories), [categories]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setCollapsed(new Set());
  }

  function collapseAll() {
    const allWithChildren = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          allWithChildren.add(n.category.id);
          walk(n.children);
        }
      });
    };
    walk(tree);
    setCollapsed(allWithChildren);
  }

  function startCreate() {
    setEditing(null);
    setFormData({ name: "", description: "", parent_id: "", sort_order: categories.length });
    setShowForm(true);
  }

  function startEdit(cat: AdminCategory) {
    setEditing(cat);
    setFormData({ name: cat.name, description: cat.description, parent_id: cat.parent || "", sort_order: cat.sort_order });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.danger("Name required");
      return;
    }
    try {
      const payload = { ...formData, parent_id: formData.parent_id || null };
      if (editing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
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
      toast.success("Removed");
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
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>Categories</h1>
        <button onClick={startCreate} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: 600 }}><Plus size={14} />Add Category</button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>{editing ? "Edit Category" : "New Category"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label style={labelStyle}>Name *</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Parent</label>
              <select value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })} style={inputStyle}>
                <option value="">— None (root) —</option>
                {categories.filter((c) => c.id !== editing?.id).map((c) => <option key={c.id} value={c.id}>{"  ".repeat(c.depth)}{c.name}</option>)}
              </select>
            </div>
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
      ) : categories.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <FolderTree size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>No categories yet.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            <button onClick={expandAll} className="rounded-md px-3 py-1.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-faint)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" }}>
              Expand all
            </button>
            <button onClick={collapseAll} className="rounded-md px-3 py-1.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-faint)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" }}>
              Collapse all
            </button>
          </div>
          <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
            {tree.map((node, i) => (
              <CategoryTreeNode
                key={node.category.id}
                node={node}
                depth={0}
                collapsed={collapsed}
                onToggle={toggleCollapse}
                onEdit={startEdit}
                onDelete={setDeleting}
                isLast={i === tree.length - 1}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmModal open={!!deleting} title="Remove Category?" message={`This will deactivate "${deleting?.name}".`} confirmLabel="Remove" destructive onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}

interface CategoryTreeNodeProps {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (cat: AdminCategory) => void;
  onDelete: (cat: AdminCategory) => void;
  isLast?: boolean;
}

function CategoryTreeNode({ node, depth, collapsed, onToggle, onEdit, onDelete, isLast }: CategoryTreeNodeProps) {
  const c = node.category;
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(c.id);

  return (
    <>
      <div
        className="flex items-center justify-between"
        style={{
          padding: "var(--space-3) var(--space-5)",
          borderBottom: !isLast ? "1px solid var(--bg-border)" : "none",
          paddingLeft: `calc(var(--space-5) + ${depth * 24}px)`,
        }}
      >
        <div className="flex flex-1 items-center gap-2">
          {hasChildren ? (
            <button
              onClick={() => onToggle(c.id)}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors duration-200 hover:bg-[rgba(187,148,41,0.1)]"
              style={{ color: "var(--white-faint)" }}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <span className="inline-block w-5" />
          )}

          {hasChildren ? (
            isCollapsed ? <Folder size={14} style={{ color: "var(--gold-dark)" }} /> : <FolderOpen size={14} style={{ color: "var(--gold-dark)" }} />
          ) : (
            <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)" }} />
          )}

          <div className="flex-1">
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
              {c.name}
              {!c.is_active && <span className="ml-2 text-xs" style={{ color: "var(--error)" }}>(inactive)</span>}
              {hasChildren && (
                <span className="ml-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--white-faint)", fontWeight: "var(--weight-regular)" }}>
                  {node.children.length} {node.children.length === 1 ? "subcategory" : "subcategories"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(c)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(187,148,41,0.1)]" style={{ color: "var(--white-faint)" }}><Pencil size={14} /></button>
          <button onClick={() => onDelete(c)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(198,40,40,0.1)]" style={{ color: "var(--white-faint)" }}><Trash2 size={14} /></button>
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        <>
          {node.children.map((child, i) => (
            <CategoryTreeNode
              key={child.category.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              isLast={isLast && i === node.children.length - 1}
            />
          ))}
        </>
      )}
    </>
  );
}
