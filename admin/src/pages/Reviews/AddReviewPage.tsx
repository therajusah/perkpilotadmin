import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Shared/Toast";
import type { ReviewApiResponse, UseCaseApiResponse, UserReviewApiResponse } from "../../types/api.types";
import Hero from "../../components/Reviews/AddReview/Hero";
import Header from "../../components/Reviews/AddReview/Header";
import OverviewTab, {
  type OverviewData,
} from "../../components/Reviews/AddReview/Tabs/Overview";
import FeaturesTab from "../../components/Reviews/AddReview/Tabs/Features";
import PricingTab from "../../components/Reviews/AddReview/Tabs/Pricing";
import AlternativesTab from "../../components/Reviews/AddReview/Tabs/Alternatives";
import ReviewsTab from "../../components/Reviews/AddReview/Tabs/Reviews";
import RatingBreakdown from "../../components/Reviews/AddReview/RatingBreakdown";
import ProsCons from "../../components/Reviews/AddReview/ProsCons";
import BestUseCase from "../../components/Reviews/AddReview/BestUseCase";
import TagChips from "../../components/Reviews/AddReview/TagChips";
import FAQ from "../../components/Reviews/AddReview/FAQ";
import FooterActions from "../../components/Reviews/AddReview/FooterActions";
import { REVIEWS_API } from "../../config/backend";
import { authenticatedPost } from "../../utils/api";
import { formatDateISO } from "../../utils/helpers";

type TabId = "overview" | "features" | "pricing" | "reviews" | "alternatives";

const parseOverview = (value?: string): OverviewData => {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as OverviewData;
    if (
      parsed &&
      typeof parsed === "object" &&
      ("heading" in parsed || "content" in parsed)
    ) {
      return parsed as OverviewData;
    }
  } catch {
    // ignore parse errors
  }
  return value;
};

const serializeOverview = (value: OverviewData): string => {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};

const getProductReviews = (
  reviews: ReviewApiResponse["productReviews"]
): UserReviewApiResponse[] => {
  return Array.isArray(reviews) ? reviews : [];
};

export default function AddReviewPage(): ReactElement {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  
  // Main review state matching backend schema
  const [reviewData, setReviewData] = useState<ReviewApiResponse>({
    userName: "",
    userTitle: "",
    userAvatar: "",
    date: formatDateISO(),
    verified: false,
    reviewText: "",
    rating: 0,
    helpful: 0,
    notHelpful: 0,

    // Product Info (empty initially)
    productName: "",
    productType: "",
    avatarUrl: "",
    description: "",
    overview: "",
    showProductUsedBy: true,
    productUsedByText: "",
    showAverageRating: false,
    averageRatingText: "",

    // Arrays
    features: [] as Array<{ title: string; description: string }>,
    pricing: [] as Array<{ plan: string; amount: string; note: string }>,
    alternatives: [] as Array<{
      name: string;
      type: string;
      avatarUrl?: string;
      price: string;
      rating: number;
      reviewCount: number;
      compareNote: string;
    }>,

    // Product Stats
    userCount: "",
    foundedYear: 0,
    employeeRange: "",
    headquarters: "",
    lastUpdated: formatDateISO(),
    upvotes: 0,
    shareCount: 0,

    // Ratings
    aggregateRating: 0,
    ratingCount: 0,
    ratingCategories: [] as Array<{
      category: string;
      value: number;
      outOf: number;
    }>,

    // Pros/Cons
    pros: [] as string[],
    cons: [] as string[],

    // FAQs
    faqs: [] as Array<{ question: string; answer: string }>,

    // Use Cases
    useCases: [] as Array<{
      title: string;
      description: string;
      rating: number;
    }>,

    // Integrations
    integrations: [] as string[],

    // Product Reviews
    productReviews: [] as UserReviewApiResponse[],
  });

  // Handler for child components to update state
  const updateReviewData = (updates: Partial<ReviewApiResponse>): void => {
    setReviewData((prev) => ({ ...prev, ...updates }));
  };

  const tabOptions: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Product Overview" },
    { id: "features", label: "Product Features" },
    { id: "pricing", label: "Product Pricing" },
    { id: "reviews", label: "Product Reviews" },
    { id: "alternatives", label: "Product Alternatives" },
  ];
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const renderActiveTab = (): ReactElement => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            initialOverview={parseOverview(reviewData.overview)}
            onOverviewChange={(overview) => {
              updateReviewData({ overview: serializeOverview(overview) });
            }}
          />
        );
      case "features":
        return (
          <FeaturesTab
            initialFeatures={reviewData.features?.map((feature, idx) => ({
              id: idx + 1,
              title: feature.title,
              body: feature.description || "",
            }))}
            onFeaturesChange={(features) => {
              updateReviewData({
                features: features.map((feature) => ({
                  title: feature.title,
                  description: feature.body,
                })),
              });
            }}
          />
        );
      case "pricing":
        return (
          <PricingTab
            initialPlans={reviewData.pricing?.map((plan, idx) => ({
              id: idx + 1,
              planTitle: plan.plan,
              price: plan.amount,
              priceType: (plan.note as "Monthly" | "Yearly" | "Lifetime") || "Monthly",
              ctaButtonText: plan.ctaText ?? "",
              ctaButtonLink: plan.ctaLink ?? "",
            }))}
            tryForFreeLink={reviewData.tryForFreeLink ?? ""}
            onPlansChange={(plans) => {
              updateReviewData({
                pricing: plans.map((plan) => ({
                  plan: plan.planTitle,
                  amount: plan.price,
                  note: plan.priceType,
                  ctaText: plan.ctaButtonText,
                  ctaLink: plan.ctaButtonLink,
                })),
              });
            }}
            onTryForFreeLinkChange={(link) => {
              updateReviewData({
                tryForFreeLink: link,
              });
            }}
          />
        );
      case "reviews": {
        const productReviews = getProductReviews(reviewData.productReviews);
        return (
          <ReviewsTab
            initialReviews={productReviews.map((review, idx) => ({
              id: idx + 1,
              profileImage: review.userAvatar ?? null,
              reviewerName: review.userName ?? "",
              companyPosition: review.userTitle ?? "",
              rating: review.rating ?? 0,
              reviewText: review.reviewText ?? "",
              helpful: review.helpful ?? 0,
              notHelpful: review.notHelpful ?? 0,
            }))}
            onReviewsChange={(reviews) => {
              updateReviewData({
                productReviews: reviews.map((review) => ({
                  userName: review.reviewerName,
                  userTitle: review.companyPosition ?? undefined,
                  userAvatar: review.profileImage ?? undefined,
                  rating: review.rating,
                  reviewText: review.reviewText,
                  helpful: review.helpful ?? 0,
                  notHelpful: review.notHelpful ?? 0,
                })),
              });
            }}
          />
        );
      }
      case "alternatives":
      default:
        return (
          <AlternativesTab
            initialAlternatives={reviewData.alternatives?.map((alternative, idx) => {
              // Ensure rating is valid (1-5)
              let validRating = alternative.rating ?? 0;
              if (validRating < 1 || validRating > 5) {
                validRating = Math.min(Math.max(Math.round(validRating), 1), 5);
              }
              if (validRating === 0) {
                validRating = 3;
              }

              return {
                id: idx + 1,
                logo: alternative.avatarUrl ?? null,
                name: alternative.name ?? "",
                isVerified: true,
                category: alternative.type ?? "",
                rating: validRating,
                reviewCount: alternative.reviewCount ?? 0,
                pricing: alternative.price ?? "",
                compareLink: alternative.compareNote ?? "",
                reviewId: alternative.reviewId ?? undefined,
              };
            })}
            onAlternativesChange={(alternatives) => {
              updateReviewData({
                alternatives: alternatives.map((alt) => {
                  // Ensure rating is between 1-5
                  let validRating = alt.rating;
                  if (validRating < 1 || validRating > 5) {
                    validRating = Math.min(Math.max(Math.round(validRating), 1), 5);
                  }
                  if (validRating === 0 || !validRating) {
                    validRating = 3; // Default to 3 if invalid
                  }

                  return {
                    name: alt.name,
                    type: alt.category,
                    avatarUrl: alt.logo ?? undefined,
                    price: alt.pricing,
                    rating: validRating,
                    reviewCount: alt.reviewCount,
                    compareNote: alt.compareLink,
                    reviewId: alt.reviewId,
                  };
                }),
              });
            }}
          />
        );
    }
  };

  // Submit handler
  const handleSaveAndPublish = async (): Promise<void> => {
    console.log("=== SAVING REVIEW ===");
    console.log("Review Data:", JSON.stringify(reviewData, null, 2));

    // Validate required fields
    if (!reviewData.productName || !reviewData.productName.trim()) {
      setToast({
        message: "Product Name is required",
        type: "error",
      });
      return;
    }

    if (!reviewData.aggregateRating || reviewData.aggregateRating === 0) {
      setToast({
        message: "Rating is required",
        type: "error",
      });
      return;
    }

    try {
      const { rating, ...dataToSend } = reviewData;
      const payload = rating && rating > 0 ? reviewData : dataToSend;

      const result = await authenticatedPost<ReviewApiResponse>(REVIEWS_API, payload);
      console.log("Review created successfully:", result);
      setToast({
        message: "Review published successfully!",
        type: "success",
      });
      // Navigate to reviews list after a short delay
      window.setTimeout(() => {
        void navigate("/reviews");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error saving review:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setToast({
        message: `Failed to save review: ${errorMessage}`,
        type: "error",
      });
    }
  };

  const handleSaveDraft = (): void => {
    console.log("Saving draft:", reviewData);
    setToast({
      message: "Draft saved locally (implement backend draft endpoint)",
      type: "info",
    });
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div
        data-layer="Frame 2147206029"
        className="Frame2147206029 w-[1116px] p-6 bg-zinc-900 rounded-3xl outline-1 outline-solid -outline-offset-1 outline-zinc-800 inline-flex flex-col justify-start items-start gap-6"
      >
        <Header onBack={() => navigate("/reviews")} />
      <Hero reviewData={reviewData} updateReviewData={updateReviewData} />
      <div className="w-full p-4 bg-zinc-800 rounded-2xl flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(): void => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-linear-to-b from-[#501bd6] to-[#7f57e2] text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {renderActiveTab()}
      </div>
      <RatingBreakdown 
        initialCategories={reviewData.ratingCategories ? reviewData.ratingCategories.map((cat) => ({
          category: cat.category,
          value: cat.value,
          outOf: cat.outOf ?? 5, // Default to 5 if undefined
        })) : undefined}
        onCategoriesChange={(categories) => {
          updateReviewData({ ratingCategories: categories });
        }}
      />
      <ProsCons 
        initialPros={reviewData.pros}
        initialCons={reviewData.cons}
        onProsChange={(pros) => {
          updateReviewData({ pros });
        }}
        onConsChange={(cons) => {
          updateReviewData({ cons });
        }}
      />
      <BestUseCase
        initialUseCases={reviewData.useCases ? reviewData.useCases.map((uc: UseCaseApiResponse, idx: number) => {
          // Ensure rating is valid (1-5)
          let validRating = uc.rating ?? 0;
          if (validRating < 1 || validRating > 5) {
            validRating = Math.min(Math.max(Math.round(validRating), 1), 5);
          }
          if (validRating === 0) {
            validRating = 3;
          }

          return {
            id: idx + 1,
            title: uc.title,
            description: uc.description ?? "",
            rating: validRating,
          };
        }) : undefined}
        onUseCasesChange={(useCases) => {
          updateReviewData({
            useCases: useCases.map((uc) => {
              // Ensure rating is between 1-5
              let validRating = uc.rating ?? 0;
              if (validRating < 1 || validRating > 5) {
                validRating = Math.min(Math.max(Math.round(validRating), 1), 5);
              }
              if (validRating === 0 || !validRating) {
                validRating = 3; // Default to 3 if invalid
              }

              return {
                title: uc.title,
                description: uc.description,
                rating: validRating,
              };
            }),
          });
        }}
      />
      <TagChips 
        tags={reviewData.integrations}
        onAdd={(tag) => {
          updateReviewData({
            integrations: [...(reviewData.integrations || []), tag]
          });
        }}
        onRemove={(tag) => {
          updateReviewData({
            integrations: reviewData.integrations?.filter(t => t !== tag) || []
          });
        }}
        placeholder="Search & Add Popular Integrations"
      />
      <FAQ 
        initialFaqs={reviewData.faqs ? reviewData.faqs.filter((faq) => 
          typeof faq.question === "string" && typeof faq.answer === "string"
        ).map((faq) => ({
          question: faq.question ?? "",
          answer: faq.answer ?? "",
        })) : undefined}
        onFaqsChange={(faqs) => {
          updateReviewData({ faqs });
        }}
      />
      <FooterActions
        onSaveDraft={handleSaveDraft}
        onSaveAndPublish={handleSaveAndPublish}
      />
      </div>
    </>
  );
}
