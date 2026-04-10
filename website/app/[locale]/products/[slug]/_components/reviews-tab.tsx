"use client";

import { useState } from "react";
import { Star, ThumbsUp, Pencil, Trash2, ShieldCheck, MessageSquare } from "lucide-react";
import { toast } from "@heroui/react";
import { StarRating } from "@/components/ui/star-rating";
import { ConfirmModal } from "@/app/[locale]/admin/_components/confirm-modal";
import {
  useCreateReview,
  useDeleteReview,
  useProductReviews,
  useReviewEligibility,
  useReviewStats,
  useToggleHelpful,
  useUpdateReview,
} from "@/hooks/use-reviews";
import { useAuth } from "@/lib/auth-context";
import type { Review, ReviewSort } from "@/types/review";

interface ReviewsTabProps {
  slug: string;
}

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
  { value: "helpful", label: "Most helpful" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Anonymous helpful-vote tracking — server can't tie an anonymous click
// back to a person, so we keep visual feedback on the device via localStorage.
// Authenticated users get the proper per-user state from the API and these
// helpers are not consulted for them.
const HELPFUL_STORAGE_KEY = "tph-helpful-votes";

function loadAnonHelpfulVotes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HELPFUL_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveAnonHelpfulVotes(votes: Set<string>) {
  try {
    localStorage.setItem(HELPFUL_STORAGE_KEY, JSON.stringify(Array.from(votes)));
  } catch {
    // ignore quota / private mode failures
  }
}

export function ReviewsTab({ slug }: ReviewsTabProps) {
  const { isAuthenticated } = useAuth();
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);

  const { data: stats } = useReviewStats(slug);
  const { data: eligibility } = useReviewEligibility(slug);
  const { data, isLoading } = useProductReviews(slug, sort, ratingFilter);
  const reviews = data?.results || [];

  const createMutation = useCreateReview(slug);
  const deleteMutation = useDeleteReview(slug);
  const helpfulMutation = useToggleHelpful(slug);
  const updateMutation = useUpdateReview(slug, editing?.id || "");
  const [submitting, setSubmitting] = useState(false);

  // Anonymous helpful-vote state. Lazy initializer reads localStorage on the
  // very first render so the gold state is visible immediately, with no
  // initial flash of un-voted. Safe because the parent ProductTabs starts
  // on the "description" tab, so this component only mounts client-side
  // after hydration.
  const [anonHelpfulVotes, setAnonHelpfulVotes] = useState<Set<string>>(
    () => loadAnonHelpfulVotes(),
  );

  function recordAnonVote(reviewId: string) {
    setAnonHelpfulVotes((prev) => {
      const next = new Set(prev);
      next.add(reviewId);
      saveAnonHelpfulVotes(next);
      return next;
    });
  }

  // Optimistic state: every review id the user has clicked in this session.
  // Used to give instant visual feedback (button turns gold + count bumps)
  // without waiting for the server round-trip + refetch.
  const [optimisticVotes, setOptimisticVotes] = useState<Set<string>>(new Set());

  function markOptimistic(reviewId: string) {
    setOptimisticVotes((prev) => {
      if (prev.has(reviewId)) return prev;
      const next = new Set(prev);
      next.add(reviewId);
      return next;
    });
  }

  function clearOptimistic(reviewId: string) {
    setOptimisticVotes((prev) => {
      if (!prev.has(reviewId)) return prev;
      const next = new Set(prev);
      next.delete(reviewId);
      return next;
    });
  }

  const total = stats?.review_count || 0;
  const average = stats?.average_rating || 0;
  const distribution = stats?.distribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  function handleWriteClick() {
    if (!eligibility) return;
    if (eligibility.can_review) {
      setEditing(null);
      setShowForm(true);
      return;
    }
    if (eligibility.reason === "login_required") {
      toast.warning("Please log in to write a review.");
      return;
    }
    if (eligibility.reason === "not_verified_buyer") {
      toast.warning("Only customers who have purchased this product can leave a review.");
      return;
    }
    if (eligibility.reason === "already_reviewed") {
      const existing = eligibility.existing_review;
      if (existing.is_editable) {
        setEditing(existing);
        setShowForm(true);
      } else {
        toast.warning("You've already reviewed this product. The 30-day edit window has closed.");
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header: average + distribution + write button */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-[260px_1fr]">
        <div
          className="rounded-lg text-center"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            padding: "var(--space-5)",
          }}
        >
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.25rem, 8vw, 3rem)", color: "var(--white)", lineHeight: 1 }}>
            {average.toFixed(1)}
          </p>
          <div className="mt-2 flex justify-center">
            <StarRating rating={average} size={18} showValue={false} />
          </div>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", marginTop: "var(--space-2)" }}>
            Based on {total} {total === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[String(star) as "1" | "2" | "3" | "4" | "5"] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const active = ratingFilter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRatingFilter(active ? null : star)}
                className="flex items-center gap-3 transition-opacity duration-200"
                style={{
                  opacity: active || ratingFilter === null ? 1 : 0.5,
                }}
              >
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)", width: "32px", textAlign: "right" }}>
                  {star}★
                </span>
                <div className="flex-1 overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary)", height: "8px" }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: "var(--gold)" }}
                  />
                </div>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", width: "30px" }}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleWriteClick}
            className="btn-gold mt-2 w-full rounded-md px-5 py-3 sm:w-auto sm:self-start sm:py-2.5"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontWeight: "var(--weight-semibold)",
              fontSize: "var(--text-sm)",
              letterSpacing: "var(--tracking-wider)",
              textTransform: "uppercase",
            }}
          >
            Write a review
          </button>
        </div>
      </div>

      {/* Sort + filter status */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ReviewSort)}
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-2) var(--space-3)",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {ratingFilter && (
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className="rounded-full px-3 py-1"
            style={{
              background: "rgba(187,148,41,0.12)",
              border: "1px solid var(--gold)",
              color: "var(--gold-dark)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
            }}
          >
            {ratingFilter}★ only ✕
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && eligibility && (eligibility.can_review || (eligibility.reason === "already_reviewed" && eligibility.existing_review.is_editable)) && (
        <ReviewForm
          initial={editing || undefined}
          submitting={submitting}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={async (data) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updateMutation.mutateAsync(data);
                toast.success("Your review has been updated.");
              } else {
                await createMutation.mutateAsync(data);
                toast.success("Thanks! Your review has been published.");
              }
              setShowForm(false);
              setEditing(null);
            } catch {
              toast.danger(editing ? "Could not update your review." : "Could not publish your review. Please try again.");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : reviews.length === 0 ? (
        <p
          className="rounded-lg py-12 text-center"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            color: "var(--white-faint)",
          }}
        >
          {ratingFilter ? `No ${ratingFilter}-star reviews yet.` : "Be the first to leave a review."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => {
            // Persistent vote state:
            //   - authenticated → server-truth `has_voted_helpful`
            //   - anonymous → localStorage Set (per-device memory)
            const persistedVote = isAuthenticated
              ? review.has_voted_helpful
              : anonHelpfulVotes.has(review.id);
            // Optimistic flip while the request is in flight, so the
            // button turns gold and the count bumps the moment you click.
            const isOptimistic = optimisticVotes.has(review.id);
            const showVoted = persistedVote || isOptimistic;
            const displayCount =
              review.helpful_count + (isOptimistic && !persistedVote ? 1 : 0);

            return (
              <ReviewCard
                key={review.id}
                review={review}
                showVoted={showVoted}
                displayCount={displayCount}
                onEdit={() => {
                  setEditing(review);
                  setShowForm(true);
                }}
                onDelete={() => setDeleting(review)}
                onHelpful={() => {
                  // Authenticated users can toggle (un-vote). For them an
                  // optimistic flip is more complex, so we keep it simple:
                  // mark optimistic only when adding a new vote, not when
                  // un-voting an existing one.
                  if (!persistedVote) markOptimistic(review.id);

                  helpfulMutation.mutate(review.id, {
                    onSuccess: () => {
                      if (!isAuthenticated) recordAnonVote(review.id);
                    },
                    onError: () => {
                      clearOptimistic(review.id);
                      toast.danger("Couldn't register your vote. Please try again.");
                    },
                  });
                }}
                helpfulPending={helpfulMutation.isPending}
              />
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete your review?"
        message="This permanently removes your review. There is no undo."
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteMutation.mutateAsync(deleting.id);
            toast.success("Review deleted.");
          } catch {
            toast.danger("Could not delete the review.");
          } finally {
            setDeleting(null);
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------
interface ReviewCardProps {
  review: Review;
  showVoted: boolean;
  displayCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onHelpful: () => void;
  helpfulPending: boolean;
}

function ReviewCard({ review, showVoted, displayCount, onEdit, onDelete, onHelpful, helpfulPending }: ReviewCardProps) {
  void helpfulPending;
  return (
    <article
      className="rounded-lg"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--bg-border)",
        padding: "var(--space-5)",
      }}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StarRating rating={review.rating} size={14} showValue={false} />
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
            {review.display_name}
          </span>
          {review.is_verified_buyer && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: "rgba(46,125,50,0.1)",
                color: "var(--success)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              <ShieldCheck size={10} />
              Verified buyer
            </span>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
          {formatDate(review.created_at)}
        </span>
      </div>

      {review.title && (
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-lg)", color: "var(--white)", marginTop: "var(--space-2)" }}>
          {review.title}
        </h3>
      )}

      <p
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          color: "var(--white-dim)",
          lineHeight: "var(--leading-relaxed)",
          marginTop: "var(--space-2)",
          whiteSpace: "pre-wrap",
        }}
      >
        {review.body}
      </p>

      {review.admin_reply && (
        <div
          className="mt-4 rounded-md"
          style={{
            background: "var(--bg-tertiary)",
            borderLeft: "3px solid var(--gold)",
            padding: "var(--space-3) var(--space-4)",
          }}
        >
          <div className="mb-1 flex items-center gap-2">
            <MessageSquare size={12} style={{ color: "var(--gold-dark)" }} />
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
              Response from The Pet Headquarters
            </span>
            {review.admin_reply_at && (
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)" }}>
                · {formatDate(review.admin_reply_at)}
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)", lineHeight: "var(--leading-relaxed)", whiteSpace: "pre-wrap" }}>
            {review.admin_reply}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onHelpful}
          disabled={review.is_own}
          className="group flex items-center gap-2 rounded-md px-3 py-1.5 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: showVoted ? "rgba(187,148,41,0.16)" : "transparent",
            border: `1px solid ${showVoted ? "var(--gold)" : "var(--bg-border)"}`,
            color: showVoted ? "var(--gold-dark)" : "var(--white-faint)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
          }}
          title={review.is_own ? "You can't vote on your own review" : ""}
        >
          <ThumbsUp
            size={12}
            fill={showVoted ? "var(--gold)" : "none"}
            className="transition-transform duration-200 group-hover:-translate-y-px"
            style={{
              transform: showVoted ? "scale(1.1)" : "scale(1)",
            }}
          />
          Helpful{displayCount > 0 && ` (${displayCount})`}
        </button>

        {review.is_own && (
          <div className="flex items-center gap-2">
            {review.is_editable && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5"
                style={{
                  border: "1px solid var(--bg-border)",
                  color: "var(--white-dim)",
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-xs)",
                }}
                title="Edit (within 30 days of posting)"
              >
                <Pencil size={11} />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5"
              style={{
                border: "1px solid rgba(198,40,40,0.4)",
                color: "var(--error)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-xs)",
              }}
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Review form
// ---------------------------------------------------------------------------
interface ReviewFormProps {
  initial?: Review;
  submitting: boolean;
  onSubmit: (data: { rating: number; title: string; body: string }) => Promise<void>;
  onCancel: () => void;
}

function ReviewForm({ initial, submitting, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(initial?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (body.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }
    if (body.length > 2000) {
      setError("Please keep your review under 2000 characters.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }

    void onSubmit({ rating, title: title.trim(), body: body.trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--gold)",
        padding: "var(--space-4)",
      }}
    >
      <h3
        className="mb-4"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-2xl)",
          color: "var(--white)",
        }}
      >
        {initial ? "Edit your review" : "Write a review"}
      </h3>

      <div className="mb-4">
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
          Your rating *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = (hoverRating || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(value)}
                style={{ cursor: "pointer" }}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Star
                  size={28}
                  fill={active ? "var(--gold)" : "transparent"}
                  style={{ color: active ? "var(--gold)" : "var(--white-faint)" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
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
          Title (optional)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Summarise your experience in a few words"
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
      </div>

      <div className="mb-4">
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
          Your review *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="Tell other customers what you and your pet thought of this product."
          className="w-full outline-none"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            resize: "vertical",
          }}
        />
        <p
          className="mt-1"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "11px",
            color: "var(--white-faint)",
          }}
        >
          {body.length} / 2000 characters · minimum 10
        </p>
      </div>

      {error && (
        <p
          className="mb-3"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            color: "var(--error)",
          }}
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="btn-gold rounded-md px-5 py-3 disabled:opacity-50 sm:py-2.5"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontWeight: "var(--weight-semibold)",
            fontSize: "var(--text-sm)",
            letterSpacing: "var(--tracking-wider)",
            textTransform: "uppercase",
          }}
        >
          {submitting ? "Saving..." : initial ? "Save changes" : "Publish review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-5 py-3 sm:py-2.5"
          style={{
            border: "1px solid var(--bg-border)",
            color: "var(--white-dim)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
