import { useEffect, useMemo, useState, type ReactElement } from "react";
import ReviewPageManagementHeader from "./ReviewPageManagement/ReviewPageManagementHeader";
import ReviewPageSettings from "./ReviewPageManagement/ReviewPageSettings";
import HeroSectionManagement from "./ReviewPageManagement/HeroSectionManagement";
import PopularTags from "./ReviewPageManagement/PopularTags";
import FeaturedReviews, {
  type ReviewSummary,
} from "./ReviewPageManagement/FeaturedReviews";
import {
  REVIEWPAGE_API,
  REVIEWS_API,
} from "../../config/backend";
import type { ReviewApiResponse } from "../../types/api.types";
import { authenticatedPut } from "../../utils/api";

interface ReviewPageSettingsData {
  _id?: string;
  reviewPageStatus: "live" | "maintenance";
  reviewPageTopTagline: string;
  reviewPageHeading: string;
  reviewPageSubheading: string;
  reviewPageTags: string[];
  featuredReviews: string[];
}

const DEFAULT_SETTINGS: ReviewPageSettingsData = {
  reviewPageStatus: "live",
  reviewPageTopTagline: "",
  reviewPageHeading: "",
  reviewPageSubheading: "",
  reviewPageTags: [],
  featuredReviews: [],
};

export default function ReviewPageManagementPage(): ReactElement {
  const [pageSettings, setPageSettings] =
    useState<ReviewPageSettingsData>(DEFAULT_SETTINGS);
  const [allReviews, setAllReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        await Promise.all([fetchPageSettings(), fetchReviews()]);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    void loadData();
  }, []);

  const normalizedFeatured = useMemo(
    () => pageSettings.featuredReviews ?? [],
    [pageSettings.featuredReviews]
  );

  async function fetchPageSettings(): Promise<void> {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching review page settings from:", String(REVIEWPAGE_API));
      const response = await fetch(REVIEWPAGE_API);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Review page settings error:", response.status, errorText);
        throw new Error(
          `Failed to load review page: ${response.status} - ${errorText || "Unknown error"}`
        );
      }
      
      const data = (await response.json()) as ReviewApiResponse;
      console.log("Review page settings loaded:", data);
      
      const featuredIds: string[] = (data.featuredReviews || []).map(
        (item) => {
          if (typeof item === "string") {
            return item;
          }
          return item._id || item.id || "";
        }
      ).filter((id): id is string => Boolean(id));

      setPageSettings({
        _id: data._id,
        reviewPageStatus: data.reviewPageStatus ?? "live",
        reviewPageTopTagline: data.reviewPageTopTagline ?? "",
        reviewPageHeading: data.reviewPageHeading ?? "",
        reviewPageSubheading: data.reviewPageSubheading ?? "",
        reviewPageTags: data.reviewPageTags ?? [],
        featuredReviews: featuredIds,
      });

      // If API returned populated featured reviews, append them to list
      const featuredReviews = data.featuredReviews;
      if (Array.isArray(featuredReviews) && featuredReviews.length > 0) {
        setAllReviews((prev) => {
          const map = new Map(prev.map((review) => [review._id, review]));
          for (const item of featuredReviews) {
            if (typeof item === "object" && item !== null && "productName" in item) {
              const reviewId = ("_id" in item && typeof item._id === "string" ? item._id : null) || 
                               ("id" in item && typeof item.id === "string" ? item.id : null);
              if (reviewId) {
                map.set(reviewId, {
                  _id: reviewId,
                  productName: typeof item.productName === "string" ? item.productName : "",
                  productType: typeof item.productType === "string" ? item.productType : undefined,
                  aggregateRating: (typeof item.aggregateRating === "number" ? item.aggregateRating : undefined) ?? 
                                   (typeof item.rating === "number" ? item.rating : undefined),
                  ratingCount: typeof item.ratingCount === "number" ? item.ratingCount : undefined,
                  avatarUrl: typeof item.avatarUrl === "string" ? item.avatarUrl : undefined,
                });
              }
            }
          }
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error("Error fetching review page settings:", err);
      const errorMessage = err instanceof Error 
          ? err.message
        : "Failed to load review page settings";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews(): Promise<void> {
    try {
      const url = `${String(REVIEWS_API)}?limit=100`;
      console.log("Fetching reviews from:", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Reviews fetch error:", response.status, errorText);
        throw new Error(
          `Failed to load reviews: ${response.status} - ${errorText || "Unknown error"}`
        );
      }

      const result = (await response.json()) as ReviewApiResponse[] | { data: ReviewApiResponse[] };
      console.log("Reviews loaded:", result);
      
      // Handle both array and object with data property
      const reviewsArray: ReviewApiResponse[] = Array.isArray(result) 
        ? result 
        : (result.data ?? []);
      
      const data: ReviewSummary[] = reviewsArray
        .filter((review) => !review.isReviewPageSettings) // Filter out settings document
        .map((review) => ({
          _id: review._id || review.id || "",
          productName: review.productName,
          productType: review.productType,
          aggregateRating: review.aggregateRating ?? review.rating,
          ratingCount: review.ratingCount,
          avatarUrl: review.avatarUrl,
        }));

      setAllReviews((prev) => {
        const map = new Map(prev.map((review) => [review._id, review]));
        data.forEach((review) => map.set(review._id, review));
        return Array.from(map.values());
      });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to load reviews list";
      // Don't override page settings error, append if needed
      setError((prev) => prev ? `${prev}; ${errorMessage}` : errorMessage);
    }
  }

  const handleHeroChange = (fields: {
    topTagline: string;
    heading: string;
    subheading: string;
  }): void => {
    setPageSettings((prev) => ({
      ...prev,
      reviewPageTopTagline: fields.topTagline,
      reviewPageHeading: fields.heading,
      reviewPageSubheading: fields.subheading,
    }));
  };

  const handleTagsChange = (tags: string[]): void => {
    setPageSettings((prev) => ({
      ...prev,
      reviewPageTags: tags,
    }));
  };

  const handleFeaturedChange = (ids: string[]): void => {
    setPageSettings((prev) => ({
      ...prev,
      featuredReviews: ids,
    }));
  };

  const handleSave = async (publish: boolean): Promise<void> => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        ...pageSettings,
        reviewPageStatus: publish ? "live" : pageSettings.reviewPageStatus,
      };

      const updated = await authenticatedPut<ReviewApiResponse>(REVIEWPAGE_API, payload);
      const featuredIds: string[] = (updated.featuredReviews || []).map(
        (item) => {
          if (typeof item === "string") {
            return item;
          }
          return item._id || item.id || "";
        }
      ).filter((id): id is string => Boolean(id));

      setPageSettings({
        _id: updated._id,
        reviewPageStatus: updated.reviewPageStatus ?? "live",
        reviewPageTopTagline: updated.reviewPageTopTagline ?? "",
        reviewPageHeading: updated.reviewPageHeading ?? "",
        reviewPageSubheading: updated.reviewPageSubheading ?? "",
        reviewPageTags: updated.reviewPageTags ?? [],
        featuredReviews: featuredIds,
      });

      setSuccessMessage("Review page settings saved successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to save review page"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-neutral-50">Loading review page settings...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="box-border flex flex-col justify-center items-center p-4 gap-6 w-[1116px] bg-[#18181B] border border-[#27272A] rounded-[24px]">
        {error && (
          <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="w-full p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        <div className="w-full flex flex-col gap-6">
          <ReviewPageManagementHeader
            onPreview={(): void => {
              // TODO: Implement preview functionality
              window.open("/reviews", "_blank");
            }}
            onSavePublish={(): void => {
              void handleSave(true);
            }}
            saving={saving}
          />
          <ReviewPageSettings
            status={pageSettings.reviewPageStatus}
            onToggle={(next): void =>
              setPageSettings((prev) => ({
                ...prev,
                reviewPageStatus: next,
              }))
            }
          />
          <HeroSectionManagement
            topTagline={pageSettings.reviewPageTopTagline}
            heading={pageSettings.reviewPageHeading}
            subheading={pageSettings.reviewPageSubheading}
            onChange={handleHeroChange}
          />
          <PopularTags
            tags={pageSettings.reviewPageTags}
            onChange={handleTagsChange}
          />
          <FeaturedReviews
            reviews={allReviews}
            selectedReviewIds={normalizedFeatured}
            onSelectionChange={handleFeaturedChange}
          />
        </div>

        <div className="flex flex-row items-center p-0 gap-4 w-[1084px] h-12">
          <button
            onClick={(): void => {
              void handleSave(false);
            }}
            disabled={saving}
            className="box-border flex flex-row justify-center items-center px-3 py-2 gap-2.5 w-[534px] h-12 border border-[#FAFAFA] rounded-lg flex-none order-0 grow"
          >
            <div className="w-[83px] h-6 font-['Poppins'] font-normal text-base leading-6 text-[#FAFAFA]">
              Save Draft
            </div>
          </button>
          <button
            onClick={(): void => {
              void handleSave(true);
            }}
            disabled={saving}
            className="flex flex-row justify-center items-center px-3 py-2 gap-2.5 w-[534px] h-12 bg-linear-to-b from-[#501BD6] to-[#7F57E2] rounded-lg flex-none order-1 grow"
          >
            <div className="w-[117px] h-6 font-['Poppins'] font-normal text-base leading-6 text-white">
              {saving ? "Saving..." : "Save & Publish"}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

