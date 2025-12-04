export type Tool = {
  id: string;
  name: string;
  logo?: string;
  category?: string;
};

export type ToolBlogCardData = {
  id: number;
  title: string;
  body: string;
  note?: string;
};

// Flexible Feature type that supports any number of tools
// Uses Record to map tool names/indices to availability
export type Feature = {
  featureName: string;
  // Maps tool index (as string key) to availability boolean
  // e.g., { "0": true, "1": false, "2": true } for 3 tools
  toolAvailability: Record<string, boolean>;
};

export type FeaturesData = {
  sectionTitle: string;
  featuresHeadline: string;
  tools: string[]; // Flexible array - supports any number of tools
  features: Feature[]; // Features with flexible tool availability
};

export type ProsConsPair = {
  pro: string;
  con: string;
};

export type ProsConsCard = {
  cardNumber: number;
  titlePros: string;
  titleCons: string;
  prosConsPairs: ProsConsPair[];
};

export type BlogModuleEntry = {
  moduleNumber: number;
  moduleName: string;
};

export type ComparisonModuleValue = {
  id: string;
  name: string;
};

export type ComparisonData = {
  pageType: string;
  heroHeading: string;
  heroBody: string;
  comparisonHeroImage: string;
  sectionHeadline: string;
  tipBulbText: string;
  toolsMentioned: Array<{
    toolName: string;
    toolLogo: string;
    toolCategory: string;
    isVerified: boolean;
  }>;
  authorId: string;
  blogCategory: string;
  readingTime: string;
  toolBlogCards: Array<{
    sectionNumber: number;
    blogTitle: string;
    blogBody: string;
  }>;
  featuresComparison: FeaturesData;
  prosConsCards: ProsConsCard[];
  moreComparisonsSectionTitle?: string;
  moreComparisons?: string[];
  slug: string;
  isPublished: boolean;
};

