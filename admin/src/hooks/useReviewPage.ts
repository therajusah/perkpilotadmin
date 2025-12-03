import { useState, useEffect, useCallback } from "react";
import { REVIEWPAGE_API } from "../config/backend";
import type { ReviewApiResponse } from "../types/api.types";
import { authenticatedPut } from "../utils/api";

export interface ReviewPageData {
  status: "live" | "maintenance";
  topTagline: string;
  heading: string;
  subheading: string;
  tags: string[];
  featuredReviews: string[]; // Review IDs
}

export interface ReviewPageApiResponse {
  reviewPageStatus?: "live" | "maintenance";
  status?: "live" | "maintenance"; // fallback if backend normalizes field
  reviewPageTopTagline?: string;
  reviewPageHeading?: string;
  reviewPageSubheading?: string;
  reviewPageTags?: string[];
  featuredReviews?: string[] | ReviewApiResponse[];
}

export function useReviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewPageData, setReviewPageData] = useState<ReviewPageData>({
    status: "live",
    topTagline: "",
    heading: "Product Reviews",
    subheading: "",
    tags: [],
    featuredReviews: [],
  });

  const fetchReviewPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(REVIEWPAGE_API);
      if (!response.ok) {
        if (response.status === 404) {
          // No review page exists yet, use defaults
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch review page: ${response.status}`);
      }
      const data = (await response.json()) as ReviewPageApiResponse;
      
      setReviewPageData({
        status: data.reviewPageStatus ?? data.status ?? "live",
        topTagline: data.reviewPageTopTagline || "",
        heading: data.reviewPageHeading || "Product Reviews",
        subheading: data.reviewPageSubheading || "",
        tags: data.reviewPageTags || [],
        featuredReviews: Array.isArray(data.featuredReviews)
          ? data.featuredReviews
              .map((r) => {
                if (typeof r === "string") {
                  return r;
                }
                return r._id || r.id || "";
              })
              .filter((id): id is string => Boolean(id))
          : [],
      });
    } catch (err) {
      console.error("Error fetching review page:", err);
      setError(err instanceof Error ? err.message : "Failed to load review page");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReviewPage = useCallback(async (data: Partial<ReviewPageData>) => {
    setError(null);
    try {
      const payload: Partial<ReviewPageApiResponse> = {
        reviewPageStatus: data.status,
        reviewPageTopTagline: data.topTagline,
        reviewPageHeading: data.heading,
        reviewPageSubheading: data.subheading,
        reviewPageTags: data.tags,
        featuredReviews: data.featuredReviews,
      };

      const updated = await authenticatedPut<ReviewPageApiResponse>(REVIEWPAGE_API, payload);
      
      setReviewPageData({
        status: updated.reviewPageStatus ?? updated.status ?? data.status ?? "live",
        topTagline: updated.reviewPageTopTagline || data.topTagline || "",
        heading: updated.reviewPageHeading || data.heading || "Product Reviews",
        subheading: updated.reviewPageSubheading || data.subheading || "",
        tags: updated.reviewPageTags || data.tags || [],
        featuredReviews: Array.isArray(updated.featuredReviews)
          ? updated.featuredReviews
              .map((r) => {
                if (typeof r === "string") {
                  return r;
                }
                return r._id || r.id || "";
              })
              .filter((id): id is string => Boolean(id))
          : data.featuredReviews || [],
      });

      return updated;
    } catch (err) {
      console.error("Error updating review page:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update review page";
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    void fetchReviewPage();
  }, [fetchReviewPage]);

  return {
    reviewPageData,
    loading,
    error,
    fetchReviewPage,
    updateReviewPage,
  };
}

