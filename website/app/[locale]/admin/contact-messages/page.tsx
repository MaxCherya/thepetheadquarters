"use client";

import { useMemo, useState } from "react";
import { Mail, MailOpen, Trash2, ExternalLink } from "lucide-react";
import { toast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import type { AdminContactMessage } from "@/types/admin";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../_components/filter-bar";
import { ConfirmModal } from "../_components/confirm-modal";

function formatDateTime(s: string): string {
  return new Date(s).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(s: string): string {
  return new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const contactKeys = {
  all: ["admin", "contact-messages"] as const,
  list: (qs: string) => [...contactKeys.all, "list", qs] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
};

export default function AdminContactMessagesPage() {
  const qc = useQueryClient();
  const [values, setValues] = useUrlFilters({});
  const debouncedSearch = useDebouncedValue(values.search || "", 300);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminContactMessage | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => {
      if (k === "search") return;
      if (v) params.set(k, v);
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [values, debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: contactKeys.list(queryString),
    queryFn: async () => {
      const url = `${endpoints.admin.contactMessages.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<AdminContactMessage>>(url);
    },
  });

  const messages = data?.results || [];

  const detailQuery = useQuery({
    queryKey: contactKeys.detail(selectedId || ""),
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: AdminContactMessage }>(
        endpoints.admin.contactMessages.detail(selectedId!),
      );
      return res.data;
    },
    enabled: !!selectedId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      return apiClient.patch<{ status: string; data: AdminContactMessage }>(
        endpoints.admin.contactMessages.detail(id),
        { is_read },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: () => toast.danger("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.del(endpoints.admin.contactMessages.detail(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Message deleted");
      setDeleting(null);
      if (deleting && selectedId === deleting.id) setSelectedId(null);
    },
    onError: () => toast.danger("Delete failed"),
  });

  function openDetail(id: string) {
    setSelectedId(id);
    // Auto-mark-as-read happens server-side on GET; refresh list once detail loads.
    setTimeout(() => qc.invalidateQueries({ queryKey: contactKeys.all }), 500);
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  const filters: FilterDef[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by name, email, subject, or body..." },
    { key: "is_read", label: "Read status", type: "boolean" },
    { key: "date_from", label: "From date", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "date_to", label: "To date", type: "text", placeholder: "YYYY-MM-DD" },
  ];

  const sortOptions = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "name", label: "Name A-Z" },
    { value: "email", label: "Email A-Z" },
  ];

  const selected = detailQuery.data;

  return (
    <div>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        Contact Messages
      </h1>

      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "-created_at"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <Mail size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            No messages match the current filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {messages.map((m, i) => {
            const unread = !m.is_read;
            return (
              <button
                key={m.id}
                onClick={() => openDetail(m.id)}
                className="flex w-full items-center justify-between text-left transition-colors duration-200 hover:bg-[rgba(187,148,41,0.08)]"
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: i < messages.length - 1 ? "1px solid var(--bg-border)" : "none",
                  background: unread ? "rgba(187,148,41,0.10)" : "transparent",
                  borderLeft: unread ? "3px solid var(--gold)" : "3px solid transparent",
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {unread ? (
                    <Mail size={16} style={{ color: "var(--gold)", flexShrink: 0 }} fill="var(--gold)" />
                  ) : (
                    <MailOpen size={16} style={{ color: "var(--white-faint)", flexShrink: 0 }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-montserrat)",
                          fontSize: "var(--text-sm)",
                          fontWeight: unread ? "var(--weight-bold)" : "var(--weight-regular)",
                          color: unread ? "var(--white)" : "var(--white-dim)",
                        }}
                      >
                        {m.name}{" "}
                        <span style={{ color: "var(--white-faint)", fontWeight: "var(--weight-regular)" }}>
                          · {m.email}
                        </span>
                      </p>
                      {unread && (
                        <span
                          className="rounded-full px-2"
                          style={{
                            background: "var(--gold)",
                            color: "#FFFFFF",
                            fontFamily: "var(--font-montserrat)",
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            paddingTop: "2px",
                            paddingBottom: "2px",
                            flexShrink: 0,
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <p
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-montserrat)",
                        fontSize: "var(--text-xs)",
                        color: unread ? "var(--white-dim)" : "var(--white-faint)",
                        marginTop: "2px",
                      }}
                    >
                      {m.subject || "(no subject)"} — {m.message.slice(0, 80)}{m.message.length > 80 ? "…" : ""}
                    </p>
                  </div>
                </div>
                <span
                  className="ml-3 shrink-0"
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-xs)",
                    color: unread ? "var(--gold-dark)" : "var(--white-faint)",
                    fontWeight: unread ? "var(--weight-semibold)" : "var(--weight-regular)",
                  }}
                >
                  <span className="sm:hidden">{formatShortDate(m.created_at)}</span>
                  <span className="hidden sm:inline">{formatDateTime(m.created_at)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelectedId(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-lg sm:rounded-lg" onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-4)" }}>
            {detailQuery.isLoading || !selected ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--white)" }}>
                      {selected.subject || "(no subject)"}
                    </h2>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginTop: "var(--space-1)" }}>
                      <span style={{ color: "var(--white)" }}>{selected.name}</span>
                      {" · "}
                      <a
                        href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "your message")}`}
                        style={{ color: "var(--gold-dark)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {selected.email}
                      </a>
                    </p>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", marginTop: "var(--space-1)" }}>
                      {formatDateTime(selected.created_at)}
                    </p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="shrink-0" style={{ color: "var(--white-faint)", fontSize: "var(--text-xl)" }}>
                    ✕
                  </button>
                </div>

                <div
                  className="mb-6 rounded-md whitespace-pre-wrap"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--bg-border)",
                    padding: "var(--space-4)",
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    color: "var(--white-dim)",
                    lineHeight: "var(--leading-relaxed)",
                    maxHeight: "40vh",
                    overflowY: "auto",
                  }}
                >
                  {selected.message}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "your message")}&body=${encodeURIComponent(`\n\n---\nOn ${formatDateTime(selected.created_at)}, ${selected.name} wrote:\n${selected.message.split("\n").map((l) => "> " + l).join("\n")}`)}`}
                    className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 sm:w-auto"
                    style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}
                  >
                    <ExternalLink size={14} />
                    Reply via email
                  </a>
                  <button
                    onClick={() => updateMutation.mutate({ id: selected.id, is_read: !selected.is_read })}
                    disabled={updateMutation.isPending}
                    title={
                      selected.is_read
                        ? "Flag this back as unread so it stays in your unread counter — useful when you want to come back to it later."
                        : "Mark as already-read so it stops showing in the unread counter."
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 disabled:opacity-50 sm:w-auto"
                    style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}
                  >
                    {selected.is_read ? <Mail size={14} /> : <MailOpen size={14} />}
                    Mark as {selected.is_read ? "unread" : "read"}
                  </button>
                  <button
                    onClick={() => setDeleting(selected)}
                    className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 sm:w-auto"
                    style={{ border: "1px solid rgba(198,40,40,0.4)", color: "var(--error)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete message?"
        message="This permanently removes the message. There is no undo."
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
