import { useState, useEffect, useCallback, type ReactElement } from "react";
import DealManagementHeader from "../../components/Deals/DealManagement/DealManagementHeader";
import DealPageSettings from "../../components/Deals/DealManagement/DealPageSettings";
import HeroSectionManagement from "../../components/Deals/DealManagement/HeroSectionManagement";
import ArticleGrid from "../../components/Deals/DealManagement/ArticleGrid";
import FooterActions from "../../components/Shared/FooterActions";
import { DEALPAGE_API, DEALS_API, STATS_API } from "../../config/backend";
import type { DealApiResponse } from "../../types/api.types";
import type { DealPageData, DealPageApiResponse } from "../../types/dealPage.types";
import Stats from "../../components/HomeManagement/Stats";
import { authenticatedPut } from "../../utils/api";

interface StatData {
  numberValue: string;
  message: string;
}

export default function DealManagementPage(): ReactElement {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [dealPageData, setDealPageData] = useState<DealPageData>({
    status: "live",
    topTagline: "",
    heading: "Software Deals",
    subheading: "",
    deals: [],
  });

  const [allDeals, setAllDeals] = useState<DealApiResponse[]>([]);
  const [statsData, setStatsData] = useState<StatData[]>([]);

  // Memoized callbacks to prevent infinite re-renders
  const handleStatsChange = useCallback((stats: StatData[]) => {
    setStatsData(stats);
  }, []);

  const handleHeroChange = useCallback((fields: {
    topTagline: string;
    mainHeadline: string;
    subHeadline: string;
    ctaText?: string;
    ctaLink?: string;
    tags: string[];
  }) => {
    setDealPageData((prev) => ({
      ...prev,
      topTagline: fields.topTagline,
      heading: fields.mainHeadline,
      subheading: fields.subHeadline,
    }));
  }, []);

  const handlePageSettingsToggle = useCallback((status: "live" | "maintenance") => {
    setDealPageData((prev) => ({ ...prev, status }));
  }, []);

  const handleDealsChange = useCallback((dealIds: string[]) => {
    setDealPageData((prev) => ({ ...prev, deals: dealIds }));
  }, []);

  // Fetch deal page data
  useEffect(() => {
    let mounted = true;
    async function fetchDealPage() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(DEALPAGE_API);
        if (!response.ok) {
          if (response.status === 404) {
            // No deal page exists yet, use defaults
            if (mounted) setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch deal page: ${response.status}`);
        }
        const data = (await response.json()) as DealPageApiResponse;
        if (!mounted) return;
        
        setDealPageData({
          status: data.status || "live",
          topTagline: data.topTagline || "",
          heading: data.heading || "Software Deals",
          subheading: data.subheading || "",
          deals: data.deals?.map((d) => 
            typeof d === "string" ? d : (d as { _id?: string; id?: string })._id || (d as { _id?: string; id?: string }).id || ""
          ).filter(Boolean) || [],
        });
      } catch (err) {
        console.error("Error fetching deal page:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load deal page");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchDealPage();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch all deals for ArticleGrid
  useEffect(() => {
    let mounted = true;
    async function fetchAllDeals() {
      try {
        const response = await fetch(DEALS_API);
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`);
        }
        const data = (await response.json()) as DealApiResponse[] | { value?: DealApiResponse[] };
        if (!mounted) return;
        setAllDeals(Array.isArray(data) ? data : data.value || []);
      } catch (err) {
        console.error("Error fetching deals:", err);
      }
    }

    void fetchAllDeals();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveDealPage = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Save deal page data
      const payload: Partial<DealPageData> = {
        heading: dealPageData.heading,
        subheading: dealPageData.subheading,
        topTagline: dealPageData.topTagline,
        deals: dealPageData.deals,
      };

      if (publish) {
        payload.status = "live";
      }

      const savedData = await authenticatedPut<DealPageApiResponse>(DEALPAGE_API, payload);
      setDealPageData({
        status: savedData.status || "live",
        topTagline: savedData.topTagline || "",
        heading: savedData.heading || "Software Deals",
        subheading: savedData.subheading || "",
        deals: savedData.deals?.map((d) =>
          typeof d === "string" ? d : (d as { _id?: string; id?: string })._id || (d as { _id?: string; id?: string }).id || ""
        ).filter(Boolean) || [],
      });

      // Save stats data
      if (statsData.length > 0) {
        const statsPayload = {
          stats: statsData.filter(stat => stat.numberValue || stat.message),
        };

        try {
          await authenticatedPut(STATS_API, statsPayload);
        } catch (err) {
          console.error("Failed to save stats:", err);
        }
      }

      setSuccessMessage(
        publish
          ? "Deal page saved and published successfully!"
          : "Deal page saved as draft successfully!"
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving deal page:", err);
      setError(err instanceof Error ? err.message : "Failed to save deal page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-neutral-50">Loading deal page settings...</div>
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
          <DealManagementHeader />
          <DealPageSettings
            status={dealPageData.status}
            onToggle={handlePageSettingsToggle}
          />
          <HeroSectionManagement
            topTagline={dealPageData.topTagline}
            mainHeadline={dealPageData.heading}
            subHeadline={dealPageData.subheading}
            onChange={handleHeroChange}
          />
          <ArticleGrid
            allDeals={allDeals}
            selectedDealIds={dealPageData.deals}
            onDealsChange={handleDealsChange}
          />
          <Stats onStatsChange={handleStatsChange} />
        </div>
        <FooterActions
          onSaveDraft={() => handleSaveDealPage(false)}
          onSavePublish={() => handleSaveDealPage(true)}
          saving={saving}
        />
      </div>
    </div>
  );
}
