import { useState, useEffect, useCallback, type ReactElement } from "react";
import BlogManagementHeader from "../components/Blogs/BlogManagement/BlogManagementHeader";
import BlogPageSettings from "../components/Blogs/BlogManagement/BlogPageSettings";
import HeroSectionManagement from "../components/Blogs/BlogManagement/HeroSectionManagement";
import ArticleGrid from "../components/Blogs/BlogManagement/ArticleGrid";
import FooterActions from "../components/Blogs/BlogManagement/FooterActions";
import Toast from "../components/Shared/Toast";
import { BLOGPAGE_API } from "../config/backend";
import { authenticatedPut } from "../utils/api";

interface BlogPageData {
  status: "live" | "maintenance";
  topTagline: string;
  mainHeadline: string;
  subHeadline: string;
  tags: string[];
}

export default function BlogManagementPage(): ReactElement {
  const [blogPageData, setBlogPageData] = useState<BlogPageData>({
    status: "live",
    topTagline: "",
    mainHeadline: "Software Blogs",
    subHeadline: "In-depth reviews, comparisons, and insights about the latest software tools and productivity solutions.",
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);


  useEffect(() => {
    const fetchBlogPage = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(BLOGPAGE_API);
        if (!response.ok) {
          throw new Error(`Failed to fetch blog page: ${response.status}`);
        }
        const data = (await response.json()) as Partial<BlogPageData>;
        setBlogPageData({
          status: data.status || "live",
          topTagline: data.topTagline || "",
          mainHeadline: data.mainHeadline || "Software Blogs",
          subHeadline: data.subHeadline || "",
          tags: data.tags || [],
        });
      } catch (err) {
        console.error("Error fetching blog page:", err);
        setError(err instanceof Error ? err.message : "Failed to load blog page settings");
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogPage();
  }, []);

  const handleStatusChange = (status: "live" | "maintenance"): void => {
    setBlogPageData((prev) => ({ ...prev, status }));
  };

  const handleHeroSectionChange = useCallback((fields: {
    topTagline: string;
    mainHeadline: string;
    subHeadline: string;
    tags: string[];
  }): void => {
    setBlogPageData((prev) => ({
        ...prev,
        topTagline: fields.topTagline,
        mainHeadline: fields.mainHeadline,
        subHeadline: fields.subHeadline,
        tags: fields.tags,
    }));
  }, []);

  const handleSave = async (publish: boolean): Promise<void> => {
    try {
      setError(null);
      await authenticatedPut(BLOGPAGE_API, {
          ...blogPageData,
          // If publish is true, ensure status is "live"
          status: publish ? "live" : blogPageData.status,
      });

      setToast({
        message: publish ? "Blog page settings saved and published!" : "Blog page settings saved as draft!",
        type: "success",
      });
    } catch (err) {
      console.error("Error saving blog page:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save blog page settings";
      setError(errorMessage);
      setToast({
        message: `Error: ${errorMessage}`,
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-neutral-50 text-lg">Loading blog page settings...</div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    <div className="flex justify-center">
      <div className="p-4 bg-zinc-900 rounded-3xl outline outline-offset-1 outline-zinc-800 inline-flex flex-col justify-center items-center gap-6 w-full max-w-[1116px]">
        {error && (
          <div className="w-full p-4 bg-red-600/20 border border-red-600 rounded-lg text-red-400">
            {error}
          </div>
        )}
        <div className="w-full flex flex-col gap-6">
          <BlogManagementHeader />
          <BlogPageSettings status={blogPageData.status} onToggle={handleStatusChange} />
          <HeroSectionManagement
            topTagline={blogPageData.topTagline}
            mainHeadline={blogPageData.mainHeadline}
            subHeadline={blogPageData.subHeadline}
            tags={blogPageData.tags}
            onChange={handleHeroSectionChange}
          />
          <ArticleGrid />
        </div>

        <FooterActions onSave={handleSave} />
      </div>
    </div>
    </>
  );
}
