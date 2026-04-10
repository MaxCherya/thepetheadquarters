"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, Eye, EyeOff, MessageSquare, Trash2, ExternalLink } from "lucide-react";
import { toast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import type { AdminReview } from "@/types/admin";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../_components/filter-bar";
import { ConfirmModal } from "../_components/confirm-modal";

const reviewKeys = {
  all: ["admin", "reviews"] as const,
  list: (qs: string) => [...reviewKeys.all, "list", qs] as const,
  detail: (id: string) => [...reviewKeys.all, "detail", id] as const,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarsInline({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < value ? "var(--gold)" : "transparent"}
          style={{ color: i < value ? "var(--gold)" : "var(--white-faint)" }}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [values, setValues] = useUrlFilters({});
  const debouncedSearch = useDebouncedValue(values.search || "", 300);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

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
    queryKey: reviewKeys.list(queryString),
    queryFn: async () => {
      const url = `${endpoints.admin.reviews.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<AdminReview>>(url);
    },
  });

  const reviews = data?.results || [];

  const detailQuery = useQuery({
    queryKey: reviewKeys.detail(selectedId || ""),
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: AdminReview }>(
        endpoints.admin.reviews.detail(selectedId!),
      );
      setReplyDraft(res.data.admin_reply || "");
      return res.data;
    },
    enabled: !!selectedId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdminReview> }) => {
      return apiClient.patch<{ status: string; data: AdminReview }>(
        endpoints.admin.reviews.detail(id),
        data,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: () => toast.danger("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.del(endpoints.admin.reviews.detail(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Review deleted");
      setDeleting(null);
      if (deleting && selectedId === deleting.id) setSelectedId(null);
    },
    onError: () => toast.danger("Delete failed"),
  });

  const filters: FilterDef[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Title, body, customer, product..." },
    {
      key: "rating",
      label: "Rating",
      type: "select",
      options: [
        { value: "5", label: "5 stars" },
        { value: "4", label: "4 stars" },
        { value: "3", label: "3 stars" },
        { value: "2", label: "2 stars" },
        { value: "1", label: "1 star" },
      ],
    },
    { key: "is_visible", label: "Visible", type: "boolean" },
    { key: "has_reply", label: "Has admin reply", type: "boolean" },
    { key: "date_from", label: "From date", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "date_to", label: "To date", type: "text", placeholder: "YYYY-MM-DD" },
  ];

  const sortOptions = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "-rating", label: "Highest rated" },
    { value: "rating", label: "Lowest rated" },
    { value: "-helpful_count", label: "Most helpful" },
  ];

  const selected = detailQuery.data;

  return (
    <div>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        Reviews
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
      ) : reviews.length === 0 ? (
        <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          No reviews match the current filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {reviews.map((r, i) => {
            const needsReply = r.is_visible && !r.admin_reply;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="flex w-full flex-col gap-2 text-left transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)] sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: i < reviews.length - 1 ? "1px solid var(--bg-border)" : "none",
                  borderLeft: !r.is_visible
                    ? "3px solid var(--error)"
                    : needsReply
                    ? "3px solid var(--gold)"
                    : "3px solid transparent",
                  opacity: r.is_visible ? 1 : 0.6,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarsInline value={r.rating} />
                    <span className="min-w-0 truncate" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                      {r.title || "(no title)"}
                    </span>
                    {!r.is_visible && (
                      <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(198,40,40,0.1)", color: "var(--error)", fontSize: "10px", textTransform: "uppercase" }}>
                        Hidden
                      </span>
                    )}
                    {needsReply && (
                      <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(187,148,41,0.12)", color: "var(--gold-dark)", fontSize: "10px", textTransform: "uppercase" }}>
                        Needs reply
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 sm:truncate" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
                    {r.body.slice(0, 120)}{r.body.length > 120 ? "…" : ""}
                  </p>
                  <p className="mt-1 truncate" style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--white-faint)" }}>
                    {r.customer_name} on <span style={{ color: "var(--gold-dark)" }}>{r.product_name}</span>
                  </p>
                </div>
                <span className="shrink-0" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {formatDate(r.created_at)}
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
                    <div className="mb-2 flex items-center gap-2">
                      <StarsInline value={selected.rating} />
                      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                        · {formatDate(selected.created_at)}
                      </span>
                    </div>
                    {selected.title && (
                      <h2 className="truncate" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--white)" }}>
                        {selected.title}
                      </h2>
                    )}
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginTop: "var(--space-1)" }}>
                      {selected.customer_name}{" "}
                      <span style={{ color: "var(--white-faint)" }}>· {selected.customer_email}</span>
                    </p>
                    <Link
                      href={`/products/${selected.product_slug}`}
                      target="_blank"
                      className="mt-1 inline-flex items-center gap-1"
                      style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--gold-dark)" }}
                    >
                      <ExternalLink size={11} />
                      {selected.product_name}
                    </Link>
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
                    maxHeight: "30vh",
                    overflowY: "auto",
                  }}
                >
                  {selected.body}
                </div>

                {/* Admin reply editor */}
                <div className="mb-6">
                  <label
                    className="mb-2 block"
                    style={{
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-xs)",
                      color: "var(--white-dim)",
                      textTransform: "uppercase",
                      letterSpacing: "var(--tracking-wide)",
                    }}
                  >
                    Public reply (shown under the review on the product page)
                  </label>
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    rows={4}
                    placeholder="Write a polite, on-brand response. Leave blank to remove an existing reply."
                    className="w-full outline-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--bg-border)",
                      color: "var(--white)",
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-sm)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-3) var(--space-4)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateMutation.mutate(
                        { id: selected.id, data: { admin_reply: replyDraft } },
                        {
                          onSuccess: () => {
                            toast.success(replyDraft ? "Reply saved" : "Reply removed");
                          },
                        },
                      );
                    }}
                    disabled={updateMutation.isPending}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 disabled:opacity-50 sm:w-auto"
                    style={{
                      background: "var(--gold)",
                      color: "#FFFFFF",
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-semibold)",
                    }}
                  >
                    <MessageSquare size={14} />
                    {selected.admin_reply ? "Update reply" : "Post reply"}
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateMutation.mutate(
                        { id: selected.id, data: { is_visible: !selected.is_visible } },
                        {
                          onSuccess: () => {
                            toast.success(selected.is_visible ? "Review hidden" : "Review made visible");
                          },
                        },
                      )
                    }
                    disabled={updateMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 disabled:opacity-50 sm:w-auto"
                    style={{
                      border: "1px solid var(--bg-border)",
                      color: "var(--white-dim)",
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {selected.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    {selected.is_visible ? "Hide review" : "Make visible"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(selected)}
                    className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 sm:w-auto"
                    style={{
                      border: "1px solid rgba(198,40,40,0.4)",
                      color: "var(--error)",
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-sm)",
                    }}
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
        title="Delete review?"
        message="This permanently removes the review and any helpful votes attached to it. Use 'Hide from product page' if you'd rather keep an audit trail."
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
