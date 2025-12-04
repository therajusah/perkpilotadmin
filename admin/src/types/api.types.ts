// API Response Types based on backend models

export interface ApiError {
  message: string;
  error?: string;
}

export interface AuthorApiResponse {
  _id: string;
  authorTitle: string;
  authorName: string;
  authorIndustry: string;
  authorViewProfileURL: string;
  authorDescription: string;
  authorImageURL?: string;
  authorXAccount?: string;
  authorIGAccount?: string;
  authorLinkedinAccount?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthorsApiResponse {
  data: AuthorApiResponse[];
}

export interface ApiResponse<T> {
  value?: T[];
  data?: T[];
  count?: number;
}

// Deal Types (from backend/src/models/deal.model.ts)
export interface DealApiResponse {
  _id?: string;
  id?: string;
  title?: string;
  category?: string;
  description?: string;
  features?: string[];
  discount?: string;
  savings?: string;
  savingsAmount?: number;
  discountPercentage?: number;
  tag?: string;
  logoUri?: string;
  verified?: boolean;
  rating?: number;
  primary_cta_text?: string;
  secondary_cta_text?: string;
  primary_cta_link?: string;
  secondary_cta_link?: string;
  dealType?: string;
  logoComponent?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Normalized Deal type for internal use (camelCase)
export interface Deal {
  _id?: string;
  title?: string;
  category?: string;
  description?: string;
  features?: string[];
  discount?: string;
  savings?: string;
  savingsAmount?: number;
  discountPercentage?: number;
  tag?: string;
  logoUri?: string;
  verified?: boolean;
  rating?: number;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to normalize API response to internal format
export function normalizeDeal(apiDeal: DealApiResponse): Deal {
  return {
    ...apiDeal,
    primaryCtaText: apiDeal.primary_cta_text,
    secondaryCtaText: apiDeal.secondary_cta_text,
    primaryCtaLink: apiDeal.primary_cta_link,
    secondaryCtaLink: apiDeal.secondary_cta_link,
    createdAt: typeof apiDeal.createdAt === 'string' ? apiDeal.createdAt : apiDeal.createdAt?.toISOString(),
    updatedAt: typeof apiDeal.updatedAt === 'string' ? apiDeal.updatedAt : apiDeal.updatedAt?.toISOString(),
  };
}

// Helper function to convert Deal back to DealApiResponse format
export function denormalizeDeal(deal: Deal): DealApiResponse {
  return {
    ...deal,
    primary_cta_text: deal.primaryCtaText,
    secondary_cta_text: deal.secondaryCtaText,
    primary_cta_link: deal.primaryCtaLink,
    secondary_cta_link: deal.secondaryCtaLink,
  };
}

// Comparison Types (from backend/src/models/comparision.model.ts)
export interface ToolApiResponse {
  toolName: string;
  toolLogo: string;
  toolCategory: string;
  isVerified: boolean;
}

export interface BlogSectionApiResponse {
  sectionNumber: number;
  blogTitle: string;
  blogBody: string;
  blogImage?: string;
  dealsMentioned?: DealApiResponse[];
  additionalNote?: string;
}

export interface FeatureApiResponse {
  featureName: string;
  tool1Available: boolean;
  tool2Available: boolean;
  tool3Available: boolean;
}

export interface FeatureComparisonApiResponse {
  sectionTitle: string;
  featuresHeadline: string;
  tools: string[];
  features: FeatureApiResponse[];
}

export interface ProsConsPairApiResponse {
  pro: string;
  con: string;
}

export interface ProsConsCardApiResponse {
  cardNumber: number;
  titlePros: string;
  titleCons: string;
  prosConsPairs: ProsConsPairApiResponse[];
}

export interface ComparisonApiResponse {
  _id?: string;
  id?: string;
  pageType: string;
  heroHeading: string;
  heroBody: string;
  comparisonHeroImage: string;
  sectionHeadline: string;
  tipBulbText: string;
  toolsMentioned: ToolApiResponse[];
  author: string;
  authorId: string;
  blogCategory: string;
  readingTime: string;
  toolBlogCards: BlogSectionApiResponse[];
  featuresComparison: FeatureComparisonApiResponse;
  prosConsCards: ProsConsCardApiResponse[];
  blogModules?: Array<{
    moduleNumber: number;
    moduleName: string;
  }>;
  moreComparisonsSectionTitle?: string;
  moreComparisons?: string[] | ComparisonApiResponse[]; 
  slug: string;
  isPublished: boolean;
  viewCount: number;
  tag?: string;
  toolCategory?: string;
  ComparisionType?: string;
  app1Logo?: string;
  app2Logo?: string;
  app1Name?: string;
  app2Name?: string;
  subtitle?: string;
  title?: string; // For generic card display
  description?: string; // For generic card display
  tags?: string[]; // For generic card display
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Comparison Page Settings Types (from backend/src/types/comparison.types.ts)
export interface ComparisonPageSettingsApiResponse {
  _id?: string;
  id?: string;
  comparisonPageStatus: "live" | "maintenance";
  comparisonPageTopTagline: string;
  comparisonPageHeading: string;
  comparisonPageSubheading: string;
  comparisonPageTags: string[];
  featuredComparisons?: string[] | ComparisonApiResponse[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Review Types (from backend/src/models/reviews.model.ts)
export interface FeatureReviewApiResponse {
  title: string;
  description?: string;
}

export interface PricingReviewApiResponse {
  plan: string;
  amount: string;
  note?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface AlternativeReviewApiResponse {
  name: string;
  type?: string;
  avatarUrl?: string;
  price?: string;
  rating?: number;
  reviewCount?: number;
  compareNote?: string;
  reviewId?: string;
}

export interface RatingCategoryApiResponse {
  category: string;
  value: number;
  outOf?: number;
}

export interface UseCaseApiResponse {
  title: string;
  description?: string;
  rating?: number;
}

export interface FAQApiResponse {
  question?: string;
  answer?: string;
}

export interface UserReviewApiResponse {
  userName: string;
  userTitle?: string;
  userAvatar?: string;
  date?: string;
  verified?: boolean;
  rating: number;
  reviewText: string;
  helpful?: number;
  notHelpful?: number;
}

export interface ReviewApiResponse {
  _id?: string;
  id?: string;
  // Review page management fields
  isReviewPageSettings?: boolean;
  reviewPageStatus?: "live" | "maintenance";
  reviewPageTopTagline?: string;
  reviewPageHeading?: string;
  reviewPageSubheading?: string;
  reviewPageTags?: string[];
  featuredReviews?: string[] | ReviewApiResponse[]; // ObjectId[] or populated reviews
  // Reviewer's details (for backward compatibility - main reviewer)
  userName?: string;
  userTitle?: string;
  userAvatar?: string;
  date?: string;
  verified?: boolean;
  reviewText?: string;
  rating?: number;
  helpful?: number;
  notHelpful?: number;
  // Product-specific review context
  productName: string;
  productType?: string;
  avatarUrl?: string;
  description?: string;
  overview?: string;
  showProductUsedBy?: boolean;
  productUsedByText?: string;
  showAverageRating?: boolean;
  averageRatingText?: string;
  features?: FeatureReviewApiResponse[];
  pricing?: PricingReviewApiResponse[];
  alternatives?: AlternativeReviewApiResponse[];
  userCount?: string;
  foundedYear?: number;
  employeeRange?: string;
  headquarters?: string;
  lastUpdated?: string;
  upvotes?: number;
  shareCount?: number;
  tryForFreeLink?: string;
  aggregateRating?: number;
  ratingCount?: number;
  ratingCategories?: RatingCategoryApiResponse[];
  pros?: string[];
  cons?: string[];
  faqs?: FAQApiResponse[];
  useCases?: UseCaseApiResponse[];
  integrations?: string[];
  productReviews?: UserReviewApiResponse[];
  logoComponent?: string;
  dealType?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

