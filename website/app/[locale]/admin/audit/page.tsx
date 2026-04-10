"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";

interface AuditEntry {
  id: string;
  user: string | null;
  user_email: string;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  ip_address: string | null;
  created_at: string;
}

interface AuditDetail extends AuditEntry {
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  user_agent: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "var(--success)",
  update: "var(--gold-dark)",
  delete: "var(--error)",
  action: "var(--info)",
};

function formatDateTime(s: string): string {
  return new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditDetail | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (modelFilter) params.set("model", modelFilter);
    const url = `${endpoints.admin.audit.list}?${params.toString()}`;
    apiClient.get<PaginatedResponse<AuditEntry>>(url)
      .then((r) => setLogs(r.results || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [actionFilter, modelFilter]);

  async function viewDetail(id: string) {
    try {
      const res = await apiClient.get<{ status: string; data: AuditDetail }>(endpoints.admin.audit.detail(id));
      setSelected(res.data);
    } catch {}
  }

  return (
    <div>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        Audit Log
      </h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <input value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} placeholder="Model name (e.g. Order)" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {logs.map((log, i) => (
            <button key={log.id} onClick={() => viewDetail(log.id)} className="flex w-full items-center justify-between text-left transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]" style={{ padding: "var(--space-3) var(--space-5)", borderBottom: i < logs.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div className="flex items-center gap-3">
                <span className="rounded-full px-2 py-0.5" style={{ background: "rgba(187,148,41,0.08)", color: ACTION_COLORS[log.action] || "var(--white-faint)", fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
                  {log.action}
                </span>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)" }}>
                    {log.model_name} · <span style={{ color: "var(--white-faint)" }}>{log.object_repr}</span>
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    {log.user_email || "system"} · {formatDateTime(log.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg" onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)", margin: "var(--space-4)" }}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
                  {selected.action} {selected.model_name}
                </h2>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {selected.user_email} · {selected.ip_address} · {formatDateTime(selected.created_at)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--white-faint)" }}>✕</button>
            </div>
            {selected.before_data && (
              <div className="mb-4">
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Before</p>
                <pre className="overflow-x-auto rounded p-3" style={{ background: "var(--bg-tertiary)", fontFamily: "monospace", fontSize: "11px", color: "var(--white-dim)" }}>{JSON.stringify(selected.before_data, null, 2)}</pre>
              </div>
            )}
            {selected.after_data && (
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>After</p>
                <pre className="overflow-x-auto rounded p-3" style={{ background: "var(--bg-tertiary)", fontFamily: "monospace", fontSize: "11px", color: "var(--white-dim)" }}>{JSON.stringify(selected.after_data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
