import { useState, useEffect, useCallback, useRef, type ReactElement } from "react";
import HeroSectionManagement from "../components/HomeManagement/HeroSectionManagement";
import FooterActions from "../components/Shared/FooterActions";
import HomeManagementHeader from "../components/HomeManagement/HomeManagementHeader";
import HomePageSettings from "../components/HomeManagement/HomePageSettings";
import DiscountedIcons from "../components/Shared/DiscountedIcons";
import Stats from "../components/HomeManagement/Stats";
import TopPicks from "../components/HomeManagement/TopsPicks";
import SoftwareCompanies from "../components/HomeManagement/SoftwareComparisions";
import TopReviews from "../components/HomeManagement/TopReviews";
import { HOMEPAGE_API } from "../config/backend";
import type { HomePageData, HomePageApiResponse, StatItem } from "../types/homepage.types";
import { authenticatedPut } from "../utils/api";

export default function HomeManagementPage(): ReactElement {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  const [homePageData, setHomePageData] = useState<HomePageData>({
    status: "live",
    hero: {
      topTagline: "For Expert Insights",
      mainHeadline: "Software Homes",
      subHeadline: "In-depth reviews, comparisons, and insights about the latest software tools and productivity solutions.",
      ctaText: "",
      ctaLink: "",
      heroImage: "",
    },
    discountedIcons: {
      topTagline: "For Expert Insights",
      mainHeadline: "Software Deals",
      subHeadline: "In-depth reviews, comparisons, and insights about the latest software tools and productivity solutions.",
      ctaText: "",
      ctaLink: "",
      icons: [],
    },
    stats: [],
    topPicks: {
      sectionTitle: "Top Picks",
      body: "Discover our top-rated software deals",
      deals: [],
    },
    softwareComparisons: {
      sectionTitle: "Software Comparisons",
      comparisons: [],
    },
    topReviews: {
      sectionTitle: "Top SaaS Reviews",
      body: "Read our expert reviews",
      reviews: [],
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Memoized callbacks to prevent infinite re-renders
  const handlePageSettingsToggle = useCallback((status: "live" | "maintenance") => {
    setHomePageData((prev) => ({ ...prev, status }));
  }, []);

  const handleHeroChange = useCallback((fields: {
    topTagline: string;
    mainHeadline: string;
    subHeadline: string;
    ctaText?: string;
    ctaLink?: string;
    tags: string[];
  }) => {
    setHomePageData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        topTagline: fields.topTagline,
        mainHeadline: fields.mainHeadline,
        subHeadline: fields.subHeadline,
        ctaText: fields.ctaText,
        ctaLink: fields.ctaLink,
        tags: fields.tags,
      },
    }));
  }, []);

  const handleDiscountedIconsChange = useCallback((fields: {
    topTagline: string;
    mainHeadline: string;
    subHeadline: string;
    ctaText?: string;
    ctaLink?: string;
    icons: Array<{ url: string; alt?: string }>;
  }) => {
    setHomePageData((prev) => ({
      ...prev,
      discountedIcons: {
        ...prev.discountedIcons,
        topTagline: fields.topTagline,
        mainHeadline: fields.mainHeadline,
        subHeadline: fields.subHeadline,
        ctaText: fields.ctaText,
        ctaLink: fields.ctaLink,
        icons: fields.icons,
      },
    }));
  }, []);

  const handleStatsChange = useCallback((stats: StatItem[]) => {
    setHomePageData((prev) => ({ ...prev, stats }));
  }, []);

  const handleTopPicksChange = useCallback((fields: {
    topTagline: string;
    mainHeadline: string;
    selectedDeals: string[];
  }) => {
    setHomePageData((prev) => ({
      ...prev,
      topPicks: {
        ...prev.topPicks,
        sectionTitle: fields.topTagline,
        body: fields.mainHeadline,
        deals: fields.selectedDeals,
      },
    }));
  }, []);

  const handleSoftwareComparisonsChange = useCallback((fields: {
    topTagline: string;
    selectedComparisons: string[];
  }) => {
    setHomePageData((prev) => ({
      ...prev,
      softwareComparisons: {
        ...prev.softwareComparisons,
        sectionTitle: fields.topTagline,
        comparisons: fields.selectedComparisons,
      },
    }));
  }, []);

  const handleTopReviewsChange = useCallback((fields: {
    topTagline: string;
    mainHeadline: string;
    selectedReviews: string[];
  }) => {
    setHomePageData((prev) => ({
      ...prev,
      topReviews: {
        ...prev.topReviews,
        sectionTitle: fields.topTagline,
        body: fields.mainHeadline,
        reviews: fields.selectedReviews,
      },
    }));
  }, []);

  // Fetch homepage data on mount
  useEffect(() => {
    let mounted = true;
    async function fetchHomePage() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(HOMEPAGE_API as RequestInfo | URL);
        if (!response.ok) {
          if (response.status === 404) {
            // No homepage exists yet, use defaults
            if (mounted) setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch homepage: ${response.status}`);
        }
        const data = (await response.json()) as HomePageApiResponse;
        if (!mounted) return;

        // Extract IDs from populated arrays (backend returns populated objects, but admin needs just IDs)
        const extractIds = (arr: Array<string | { _id: string }> | undefined): string[] => {
          if (!arr || !Array.isArray(arr)) return [];
          return arr.map((item) => (typeof item === 'string' ? item : item._id)).filter((id): id is string => Boolean(id));
        };

        setHomePageData({
          status: data.status || "live",
          hero: data.hero || {
            topTagline: "For Expert Insights",
            mainHeadline: "Software Homes",
            subHeadline: "In-depth reviews, comparisons, and insights about the latest software tools and productivity solutions.",
            ctaText: "",
            ctaLink: "",
            tags: ["AI Tools", "No-code", "Marketing"],
            heroImage: "",
          },
          discountedIcons: data.discountedIcons || {
            topTagline: "For Expert Insights",
            mainHeadline: "Software Deals",
            subHeadline: "In-depth reviews, comparisons, and insights about the latest software tools and productivity solutions.",
            ctaText: "",
            ctaLink: "",
            tags: ["AI Tools", "No-code", "Marketing"],
            icons: [],
          },
          stats: data.stats || [],
          topPicks: {
            sectionTitle: data.topPicks?.sectionTitle || "Top Picks",
            body: data.topPicks?.body || "Discover our top-rated software deals",
            deals: extractIds(data.topPicks?.deals),
          },
          softwareComparisons: {
            sectionTitle: data.softwareComparisons?.sectionTitle || "Software Comparisons",
            comparisons: extractIds(data.softwareComparisons?.comparisons),
          },
          topReviews: {
            sectionTitle: data.topReviews?.sectionTitle || "Top SaaS Reviews",
            body: data.topReviews?.body || "Read our expert reviews",
            reviews: extractIds(data.topReviews?.reviews),
          },
        });
      } catch (err) {
        console.error("Error fetching homepage:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load homepage");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchHomePage();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveHomePage = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: Partial<HomePageData> = {
        hero: homePageData.hero,
        discountedIcons: homePageData.discountedIcons,
        stats: homePageData.stats,
        topPicks: homePageData.topPicks,
        softwareComparisons: homePageData.softwareComparisons,
        topReviews: homePageData.topReviews,
        status: publish ? "live" : homePageData.status,
      };

      const savedData = await authenticatedPut<HomePageApiResponse>(HOMEPAGE_API, payload);

      // Extract IDs from populated arrays
      const extractIds = (arr: Array<string | { _id: string }> | undefined): string[] => {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map((item) => (typeof item === 'string' ? item : item._id)).filter((id): id is string => Boolean(id));
      };

      setHomePageData({
        status: savedData.status || "live",
        hero: savedData.hero || homePageData.hero,
        discountedIcons: savedData.discountedIcons || homePageData.discountedIcons,
        stats: savedData.stats || [],
        topPicks: {
          sectionTitle: savedData.topPicks?.sectionTitle || homePageData.topPicks.sectionTitle,
          body: savedData.topPicks?.body || homePageData.topPicks.body,
          deals: extractIds(savedData.topPicks?.deals),
        },
        softwareComparisons: {
          sectionTitle: savedData.softwareComparisons?.sectionTitle || homePageData.softwareComparisons.sectionTitle,
          comparisons: extractIds(savedData.softwareComparisons?.comparisons),
        },
        topReviews: {
          sectionTitle: savedData.topReviews?.sectionTitle || homePageData.topReviews.sectionTitle,
          body: savedData.topReviews?.body || homePageData.topReviews.body,
          reviews: extractIds(savedData.topReviews?.reviews),
        },
      });

      setSuccessMessage(
        publish
          ? "Homepage saved and published successfully!"
          : "Homepage saved as draft successfully!"
      );

      // Clear success message after 3 seconds
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save homepage");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-neutral-50">Loading homepage settings...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="p-4 bg-zinc-900 rounded-3xl outline-1 -outline-offset-1 outline-zinc-800 inline-flex flex-col justify-center items-center gap-6 w-full max-w-[1116px]">
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
          <HomeManagementHeader />
          <HomePageSettings
            status={homePageData.status}
            onToggle={handlePageSettingsToggle}
          />
          <HeroSectionManagement
            topTagline={homePageData.hero.topTagline}
            mainHeadline={homePageData.hero.mainHeadline}
            subHeadline={homePageData.hero.subHeadline}
            ctaText={homePageData.hero.ctaText}
            ctaLink={homePageData.hero.ctaLink}
            onChange={handleHeroChange}
          />
          <DiscountedIcons
            topTagline={homePageData.discountedIcons.topTagline}
            mainHeadline={homePageData.discountedIcons.mainHeadline}
            subHeadline={homePageData.discountedIcons.subHeadline}
            ctaText={homePageData.discountedIcons.ctaText}
            ctaLink={homePageData.discountedIcons.ctaLink}
            onChange={handleDiscountedIconsChange}
          />
          <Stats onStatsChange={handleStatsChange} />
          <TopPicks
            topTagline={homePageData.topPicks.sectionTitle}
            mainHeadline={homePageData.topPicks.body}
            selectedDeals={homePageData.topPicks.deals}
            onChange={handleTopPicksChange}
          />
          <SoftwareCompanies
            topTagline={homePageData.softwareComparisons.sectionTitle}
            selectedComparisons={homePageData.softwareComparisons.comparisons}
            onChange={handleSoftwareComparisonsChange}
          />
          <TopReviews
            topTagline={homePageData.topReviews.sectionTitle}
            mainHeadline={homePageData.topReviews.body}
            selectedReviews={homePageData.topReviews.reviews}
            onChange={handleTopReviewsChange}
          />
        </div>
        <FooterActions
          onSaveDraft={() => handleSaveHomePage(false)}
          onSavePublish={() => handleSaveHomePage(true)}
          saving={saving}
        />
      </div>
    </div>
  );
}
