/**
 * Typed interfaces for the Google Business Profile APIs.
 *
 * Reviews and local posts come from the My Business v4 REST API
 * (mybusiness.googleapis.com/v4 — not bundled in the googleapis npm client,
 * called via the OAuth2 client's .request()). Insights come from the current
 * Business Profile Performance API (businessprofileperformance.googleapis.com/v1).
 */

export type GBPStarRating = "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";

export type GBPReviewReply = {
  comment: string;
  updateTime: string; // ISO timestamp
};

export type GBPReview = {
  name: string; // accounts/{a}/locations/{l}/reviews/{reviewId}
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
    isAnonymous?: boolean;
  };
  starRating: GBPStarRating;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: GBPReviewReply;
};

export type GBPReviewsResult = {
  reviews: GBPReview[];
  nextPageToken?: string;
  averageRating: number;
  totalReviewCount: number;
};

export type GBPPostType = "STANDARD" | "EVENT" | "OFFER";

/** Shape of a localPost as returned by the v4 API. */
export type GBPLocalPost = {
  name: string; // accounts/{a}/locations/{l}/localPosts/{postId}
  summary?: string;
  state: string; // LIVE | REJECTED | PROCESSING
  topicType: string; // STANDARD | EVENT | OFFER
  callToAction?: {
    actionType: string; // CALL, LEARN_MORE, ORDER, SIGN_UP, BUY, BOOK
    url?: string;
  };
  event?: {
    title?: string;
    schedule?: {
      startDate?: { year: number; month: number; day: number };
      startTime?: { hours?: number; minutes?: number };
      endDate?: { year: number; month: number; day: number };
      endTime?: { hours?: number; minutes?: number };
    };
  };
  offer?: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
  createTime: string;
  updateTime: string;
  searchUrl?: string;
};

export type CreatePostInput = {
  type: GBPPostType;
  summary: string;
  ctaType?: string;
  ctaUrl?: string;
  eventTitle?: string;
  eventStart?: string; // ISO datetime
  eventEnd?: string; // ISO datetime
  offerTitle?: string;
  offerCode?: string;
};

export type GBPInsightMetric = {
  metric: string;
  total: number;
  /** Daily values, oldest first. */
  series: { date: string; value: number }[];
};

export type GBPInsights = {
  metrics: GBPInsightMetric[];
};
