export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  display_name: string;
  is_verified_buyer: boolean;
  helpful_count: number;
  admin_reply: string;
  admin_reply_at: string | null;
  created_at: string;
  updated_at: string;
  is_editable: boolean;
  is_own: boolean;
  has_voted_helpful: boolean;
}

export interface ReviewStats {
  average_rating: number;
  review_count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export type ReviewSort = "newest" | "highest" | "lowest" | "helpful";

export type ReviewEligibility =
  | { can_review: true }
  | { can_review: false; reason: "login_required" }
  | { can_review: false; reason: "not_verified_buyer" }
  | { can_review: false; reason: "already_reviewed"; existing_review: Review };

export interface MyReview extends Review {
  product_slug: string;
  product_name: string;
}
