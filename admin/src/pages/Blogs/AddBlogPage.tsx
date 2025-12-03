import { useState, useEffect, useMemo, type ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Hero from "../../components/Shared/Hero";
import ToolsMentioned from "../../components/Shared/ToolsMentioned";
import Author from "../../components/Shared/Author";
import ModulesCard from "../../components/Shared/ModulesCard";
import ToolBlogCard from "../../components/Shared/ToolBlogCard";
import SimilarBlogs from "../../components/Blogs/AddBlog/SimilarBlogs";
import Toast, { type ToastLink } from "../../components/Shared/Toast";
import type { Tool } from "../../types/comparison.types";
import type { BlogSectionApiResponse, DealApiResponse } from "../../types/api.types";
import type { BlogData } from "../../types/blog.types";
import { BLOGS_API } from "../../config/backend";
import { authenticatedPost, authenticatedPut } from "../../utils/api";

export default function AddBlogPage(): ReactElement {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    links?: ToastLink[];
  } | null>(null);
  const [blogData, setBlogData] = useState<BlogData>({
    blogHeading: "",
    blogBody: "",
    blogHeroImage: "",
    sectionHeadline: "",
    tipBulbText: "",
    blogToolsMentioned: [],
    blogAuthor: "",
    blogCategory: "",
    blogReadingTime: "5 Minute",
    modules: [],
    blogToolBlogCards: [],
    moreBlogsSectionTitle: "",
    moreBlogs: [],
    blogSlug: "",
    blogIsPublished: false,
  });

  // Fetch blog data when in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    let mounted = true;
    async function loadBlog(): Promise<void> {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${BLOGS_API}/${id}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Blog not found" : "Failed to fetch blog");
        }
        const blog = await response.json() as BlogData & {
          _id?: string;
          blogAuthor?: string | { _id?: string; authorName?: string; [key: string]: unknown };
        };

        if (!mounted) return;

        // Extract author ID - handle both string and populated object
        let authorId = "";
        if (typeof blog.blogAuthor === "string") {
          authorId = blog.blogAuthor;
        } else if (blog.blogAuthor && typeof blog.blogAuthor === "object") {
          const authorObj = blog.blogAuthor as { _id?: string; [key: string]: unknown };
          if (authorObj._id) {
            authorId = authorObj._id;
          }
        }

        // Ensure blogToolBlogCards have sectionNumber
        const toolBlogCards = (blog.blogToolBlogCards || []).map((card, index) => {
          // Transform dealsMentioned from backend format to DealApiResponse format if needed
          const transformedDeals: DealApiResponse[] = (card.dealsMentioned || []).map((deal: unknown): DealApiResponse => {
            // Check if it's already in DealApiResponse format (has title/logoUri)
            if (deal && typeof deal === 'object' && 'title' in deal) {
              return deal as DealApiResponse;
            }
            // Transform from backend format (toolName/toolLogo/toolCategory) to DealApiResponse format
            if (deal && typeof deal === 'object' && 'toolName' in deal) {
              const backendDeal = deal as { toolName: string; toolLogo: string; toolCategory: string; isVerified?: boolean };
              return {
                title: backendDeal.toolName,
                logoUri: backendDeal.toolLogo,
                category: backendDeal.toolCategory,
                verified: backendDeal.isVerified || false,
              };
            }
            // Fallback - return empty deal structure
            return {
              title: "",
              logoUri: "",
              category: "Tool",
              verified: false,
            };
          });
          
          return {
            ...card,
            sectionNumber: card.sectionNumber ?? index + 1,
            dealsMentioned: transformedDeals,
          };
        });

        setBlogData({
          blogHeading: blog.blogHeading || "",
          blogBody: blog.blogBody || "",
          blogHeroImage: blog.blogHeroImage || "",
          sectionHeadline: blog.sectionHeadline || "",
          tipBulbText: blog.tipBulbText || "",
          blogToolsMentioned: blog.blogToolsMentioned || [],
          blogAuthor: authorId,
          blogCategory: blog.blogCategory || "",
          blogReadingTime: blog.blogReadingTime || "5 Minute",
          modules: blog.modules || [],
          blogToolBlogCards: toolBlogCards,
          moreBlogsSectionTitle: blog.moreBlogsSectionTitle || "",
          moreBlogs: blog.moreBlogs || [],
          blogSlug: blog.blogSlug || "",
          blogIsPublished: blog.blogIsPublished || false,
        });
      } catch (error) {
        console.error("Error loading blog:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load blog. Please try again.";
        if (mounted) setLoadError(errorMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadBlog();
    return () => {
      mounted = false;
    };
  }, [id, isEditMode]);

  const handleBack = (): void => {
    void navigate("/blogs");
  };

  const handleHeroHeadingChange = (heading: string): void => {
    const slug = heading
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setBlogData((prev) => ({
      ...prev,
      blogHeading: heading,
      blogSlug: slug,
    }));
  };

  const handleHeroBodyChange = (body: string): void => {
    setBlogData((prev) => ({
      ...prev,
      blogBody: body,
    }));
  };

  const handleHeroImageChange = (imageUrl: string): void => {
    setBlogData((prev) => ({
      ...prev,
      blogHeroImage: imageUrl,
    }));
  };

  const handleToolsChange = (tools: Tool[]): void => {
    const blogToolsMentioned = tools.map((tool) => ({
      toolName: tool.name || "",
      toolLogo: tool.logo || "",
      toolCategory: tool.category || "Tool",
      isVerified: false,
    }));
    setBlogData((prev) => ({
      ...prev,
      blogToolsMentioned,
    }));
  };

  const handleToolsHeadlineChange = (headline: string): void => {
    setBlogData((prev) => ({
      ...prev,
      sectionHeadline: headline,
    }));
  };

  const handleTipChange = (tip: string): void => {
    setBlogData((prev) => ({
      ...prev,
      tipBulbText: tip,
    }));
  };

  const handleAuthorChange = (authorId: string | undefined): void => {
    setBlogData((prev) => ({
      ...prev,
      blogAuthor: authorId || "",
    }));
  };

  const handleCategoryChange = (category: string): void => {
    setBlogData((prev) => ({
      ...prev,
      blogCategory: category,
    }));
  };

  const handleReadingTimeChange = (readingTime: string): void => {
    setBlogData((prev) => ({
      ...prev,
      blogReadingTime: readingTime,
    }));
  };

  const handleModulesChange = (modules: Array<{ title: string; benefits: string[] }>): void => {
    // Transform modules to match blog structure
    const blogModules = modules
      .filter((m) => m.title?.trim() || m.benefits.some((b) => b.trim()))
      .map((m) => ({
        title: m.title.trim() || "Module Benefits",
        benefits: m.benefits.filter((b) => b.trim() !== ""),
      }));
    
    setBlogData((prev) => ({
      ...prev,
      modules: blogModules,
    }));
  };

  const handleToolBlogCardsChange = (cards: BlogSectionApiResponse[]): void => {
    setBlogData((prev) => ({
      ...prev,
      blogToolBlogCards: cards,
    }));
  };

  const handleMoreBlogsSectionTitleChange = (title: string): void => {
    setBlogData((prev) => ({
      ...prev,
      moreBlogsSectionTitle: title,
    }));
  };

  // Memoize initialModules to prevent unnecessary re-renders
  // Only recompute when blogData.modules actually changes (not on every render)
  const memoizedInitialModules = useMemo(() => {
    if (blogData.modules && blogData.modules.length > 0) {
      return blogData.modules.map((m, index) => ({
        id: `module-${index}-${m.title}`,
        title: m.title,
        benefits: m.benefits,
      }));
    }
    return undefined;
  }, [blogData.modules]);

  const handleMoreBlogsChange = (blogs: Array<{
    blogId?: string;
    title?: string;
    description?: string;
    image?: string;
    category?: string;
    tags?: string[];
    featured?: boolean;
    readingTime?: string;
    viewCount?: number;
    date?: string;
  }>): void => {
    setBlogData((prev) => ({
      ...prev,
      moreBlogs: blogs,
    }));
  };

  const handleDeleteMoreBlogsSection = (): void => {
    setBlogData((prev) => ({
      ...prev,
      moreBlogsSectionTitle: "",
      moreBlogs: [],
    }));
  };


  // Helper function to clean and validate blog data before sending
  const prepareBlogData = (): BlogData | null => {
    // Type guard to check if deal is in backend format
    const isBackendFormat = (deal: unknown): deal is { toolName: string; toolLogo: string; toolCategory: string; isVerified?: boolean } => {
      return (
        typeof deal === 'object' &&
        deal !== null &&
        'toolName' in deal &&
        'toolLogo' in deal &&
        'toolCategory' in deal &&
        typeof (deal as { toolName: unknown }).toolName === 'string' &&
        typeof (deal as { toolLogo: unknown }).toolLogo === 'string' &&
        typeof (deal as { toolCategory: unknown }).toolCategory === 'string'
      );
    };

    // Type guard to check if deal is in DealApiResponse format
    const isDealApiResponse = (deal: unknown): deal is { title?: string; logoUri?: string; category?: string; tag?: string; verified?: boolean } => {
      return typeof deal === 'object' && deal !== null;
    };

    // Filter out empty tool blog cards (those without title or body)
    const validToolBlogCards = (blogData.blogToolBlogCards || [])
      .filter((card) => card.blogTitle?.trim() && card.blogBody?.trim())
      .map((card) => {
        // Transform dealsMentioned to match backend schema format
        const transformedDeals = (card.dealsMentioned || [])
          .map((deal) => {
            // Check if it's already in backend format
            if (isBackendFormat(deal)) {
              // Already in correct format, just ensure required fields are present
              const toolName = deal.toolName?.trim() || '';
              const toolLogo = deal.toolLogo?.trim() || '';
              const toolCategory = deal.toolCategory?.trim() || '';
              
              if (toolName && toolLogo && toolCategory) {
                return {
                  toolName,
                  toolLogo,
                  toolCategory,
                  isVerified: deal.isVerified || false,
                };
              }
              return null;
            }
            
            // Transform from DealApiResponse format (title, logoUri, category) to backend format
            if (isDealApiResponse(deal)) {
              const toolName = (deal.title || '').trim();
              const toolLogo = (deal.logoUri || '').trim();
              const toolCategory = (deal.category || deal.tag || '').trim();
              
              // Only include if all required fields are present
              if (toolName && toolLogo && toolCategory) {
                return {
                  toolName,
                  toolLogo,
                  toolCategory,
                  isVerified: deal.verified || false,
                };
              }
            }
            return null;
          })
          .filter((deal): deal is { toolName: string; toolLogo: string; toolCategory: string; isVerified: boolean } => deal !== null);

        return {
          ...card,
          // Cast to any to bypass type checking since we're transforming to backend format
          // The API expects the backend format, not the DealApiResponse format
          dealsMentioned: transformedDeals as unknown as typeof card.dealsMentioned,
        };
      });

    // Validate required fields
    if (!blogData.blogHeroImage?.trim()) {
      setToast({
        message: "Please upload a hero image for the blog.",
        type: "error",
      });
      return null;
    }

    if (!blogData.blogHeading?.trim()) {
      setToast({
        message: "Please enter a blog heading.",
        type: "error",
      });
      return null;
    }

    if (!blogData.blogBody?.trim()) {
      setToast({
        message: "Please enter blog body content.",
        type: "error",
      });
      return null;
    }

    if (!blogData.sectionHeadline?.trim()) {
      setToast({
        message: "Please enter a section headline.",
        type: "error",
      });
      return null;
    }

    if (!blogData.tipBulbText?.trim()) {
      setToast({
        message: "Please enter tip bulb text.",
        type: "error",
      });
      return null;
    }

    if (!blogData.blogAuthor) {
      setToast({
        message: "Please select an author.",
        type: "error",
      });
      return null;
    }

    if (!blogData.blogCategory?.trim()) {
      setToast({
        message: "Please select a category.",
        type: "error",
      });
      return null;
    }

    if (!blogData.blogReadingTime?.trim()) {
      setToast({
        message: "Please enter reading time.",
        type: "error",
      });
      return null;
    }

    // Return cleaned data
    // Cast to BlogData to satisfy type checker - the dealsMentioned is transformed to backend format
    // which is what the API expects, even though BlogData type shows DealApiResponse format
    // Note: blogBody contains HTML, so we only trim if it's not HTML (to preserve HTML structure)
    const cleanBlogBody = blogData.blogBody && /<[a-z][\s\S]*>/i.test(blogData.blogBody)
      ? blogData.blogBody.trim() // Trim HTML but preserve structure
      : blogData.blogBody.trim();
    
    return {
      ...blogData,
      blogHeroImage: blogData.blogHeroImage.trim(),
      blogHeading: blogData.blogHeading.trim(),
      blogBody: cleanBlogBody,
      sectionHeadline: blogData.sectionHeadline.trim(),
      tipBulbText: blogData.tipBulbText.trim(),
      blogCategory: blogData.blogCategory.trim(),
      blogReadingTime: blogData.blogReadingTime.trim(),
      blogToolBlogCards: validToolBlogCards.map((card) => ({
        ...card,
        blogBody: card.blogBody && /<[a-z][\s\S]*>/i.test(card.blogBody)
          ? card.blogBody.trim()
          : card.blogBody?.trim() || "",
      })),
    } as BlogData;
  };

  const saveBlog = async (cleanedData: ReturnType<typeof prepareBlogData>, publish: boolean): Promise<string> => {
      const url = isEditMode && id ? `${BLOGS_API}/${id}` : BLOGS_API;
      const payload = {
          ...cleanedData,
        blogIsPublished: publish,
      };

      const savedBlog = isEditMode
        ? await authenticatedPut<{ _id?: string; blogSlug?: string }>(url, payload)
        : await authenticatedPost<{ _id?: string; blogSlug?: string }>(url, payload);
      
      return savedBlog._id || id || "";
  };

  const handleSaveDraft = async (): Promise<void> => {
    if (!navigate) return;
    try {
      setIsSaving(true);
      const cleanedData = prepareBlogData();
      if (!cleanedData) return;

      await saveBlog(cleanedData, false);
      
      // Show success toast with link
      const blogSlug = cleanedData.blogSlug || "";
      const frontendUrl = blogSlug ? `http://localhost:5173/blog/${blogSlug}` : undefined;
      
      setToast({
        message: "Blog saved as draft successfully!",
        type: "success",
        links: frontendUrl ? [
          {
            text: "View Blog",
            url: frontendUrl,
            external: true,
          },
        ] : undefined,
      });

      // Redirect after a short delay to show toast
      void setTimeout(() => {
        void navigate("/blogs");
      }, 2000);
    } catch (error) {
      console.error("Error saving draft:", error);
      setToast({
        message: error instanceof Error ? error.message : "Failed to save draft. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (): Promise<void> => {
    try {
      setIsSaving(true);
      const cleanedData = prepareBlogData();
      if (!cleanedData) return;

      await saveBlog(cleanedData, true);
      
      // Show success toast with link
      const blogSlug = cleanedData.blogSlug || "";
      const frontendUrl = blogSlug ? `http://localhost:5173/blog/${blogSlug}` : undefined;
      
      setToast({
        message: isEditMode ? "Blog updated and published successfully!" : "Blog published successfully!",
        type: "success",
        links: frontendUrl ? [
          {
            text: "View Blog",
            url: frontendUrl,
            external: true,
          },
        ] : undefined,
      });

      // Redirect after a short delay to show toast
      void setTimeout(() => {
        void navigate("/blogs");
      }, 2000);
    } catch (error) {
      console.error("Error publishing blog:", error);
      setToast({
        message: error instanceof Error ? error.message : "Failed to publish blog. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          links={toast.links}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex justify-center p-4">
        <div
          data-layer="Frame 2147206029"
          className="box-border flex flex-col justify-start items-start p-6 gap-6 w-[1116px] bg-[#18181B] border border-[#27272A] rounded-3xl"
        >
        {/* Header with Back Button */}
        <div className="box-border flex flex-row items-center p-0 pb-4 gap-4 w-[719px] h-12 border-b border-[#27272A]">
          <button
            type="button"
            aria-label="Back"
            onClick={handleBack}
            className="flex flex-row justify-center items-center p-[3px_5px] gap-2.5 w-8 h-8 bg-linear-to-b from-[#501BD6] to-[#7F57E2] rounded-[100px] transform -rotate-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="18"
              viewBox="0 0 14 18"
              fill="none"
              className="transform rotate-90"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.21934 7.29865C0.0788896 7.15802 0 6.9674 0 6.76865C0 6.56989 0.0788896 6.37927 0.21934 6.23865L6.21934 0.238645C6.288 0.164958 6.3708 0.105856 6.4628 0.0648642C6.5548 0.0238724 6.65412 0.00183105 6.75482 5.43594e-05C6.85552 -0.00172234 6.95555 0.0168018 7.04894 0.0545225C7.14233 0.0922432 7.22716 0.148389 7.29838 0.219607C7.3696 0.290826 7.42574 0.37566 7.46346 0.469049C7.50118 0.562437 7.51971 0.662464 7.51793 0.763167C7.51616 0.863871 7.49411 0.963185 7.45312 1.05518C7.41213 1.14718 7.35303 1.22998 7.27934 1.29865L2.55934 6.01865L16.7493 6.01865C16.9483 6.01865 17.139 6.09766 17.2797 6.23832C17.4203 6.37897 17.4993 6.56973 17.4993 6.76865C17.4993 6.96756 17.4203 7.15832 17.2797 7.29897C17.139 7.43963 16.9483 7.51865 16.7493 7.51865L2.55934 7.51865L7.27934 12.2386C7.35303 12.3073 7.41213 12.3901 7.45312 12.4821C7.49411 12.5741 7.51616 12.6734 7.51793 12.7741C7.51971 12.8748 7.50118 12.9749 7.46346 13.0682C7.42574 13.1616 7.3696 13.2465 7.29838 13.3177C7.22716 13.3889 7.14233 13.445 7.04894 13.4828C6.95555 13.5205 6.85552 13.539 6.75482 13.5372C6.65412 13.5355 6.5548 13.5134 6.4628 13.4724C6.3708 13.4314 6.288 13.3723 6.21934 13.2986L0.21934 7.29865Z"
                fill="white"
              />
            </svg>
          </button>
          <div className="flex flex-col justify-start items-start gap-2 w-[671px]">
            <div className="flex flex-col justify-start items-start gap-1 w-[671px]">
              <div className="w-[671px] h-8 text-neutral-50 text-xl font-medium font-['Poppins'] leading-8">
                {isEditMode ? "Edit Tools Comparison Blog" : "Create New Tools Comparison Blog"}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full text-center py-8 text-neutral-50">
            Loading blog data...
          </div>
        )}

        {/* Error State */}
        {loadError && !loading && (
          <div className="w-full p-6 bg-red-900/20 border border-red-500/50 rounded-xl">
            <div className="flex flex-col gap-3">
              <div className="text-red-400 text-lg font-medium">Error Loading Blog</div>
              <div className="text-red-300 text-sm">{loadError}</div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate("/blogs")}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-neutral-50 text-sm transition-colors"
                >
                  Back to Blogs
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {/* Blog Hero Section */}
            <Hero
              heading={blogData.blogHeading}
              body={blogData.blogBody}
              image={blogData.blogHeroImage}
              onHeadingChange={handleHeroHeadingChange}
              onBodyChange={handleHeroBodyChange}
              onImageChange={handleHeroImageChange}
            />

            {/* Tools Mentioned Section */}
            <ToolsMentioned
              headline={blogData.sectionHeadline}
              tip={blogData.tipBulbText}
              initialTools={(blogData.blogToolsMentioned || []).filter(tool => tool && tool.toolName).map((tool) => ({
                id: tool.toolName,
                name: tool.toolName,
                logo: tool.toolLogo,
                category: tool.toolCategory,
              }))}
              onToolsChange={handleToolsChange}
              onHeadlineChange={handleToolsHeadlineChange}
              onTipChange={handleTipChange}
              searchPlaceholder="Search & Add Deals"
            />

            {/* Author, Category, Reading Time */}
            <Author
              onAuthorChange={handleAuthorChange}
              onCategoryChange={handleCategoryChange}
              onReadingTimeChange={handleReadingTimeChange}
              initialAuthorId={blogData.blogAuthor}
              initialCategory={blogData.blogCategory}
              initialReadingTime={blogData.blogReadingTime}
            />

            {/* Modules Card */}
            <ModulesCard
              initialModules={memoizedInitialModules}
              onModulesChange={handleModulesChange}
            />

            {/* Tool Blog Cards */}
            <ToolBlogCard
              initialCards={blogData.blogToolBlogCards || []}
              onCardsChange={handleToolBlogCardsChange}
            />

            {/* Similar Posts Section */}
            <SimilarBlogs
              sectionTitle={blogData.moreBlogsSectionTitle}
              selectedBlogs={blogData.moreBlogs}
              onSectionTitleChange={handleMoreBlogsSectionTitleChange}
              onBlogsChange={handleMoreBlogsChange}
              onDeleteSection={handleDeleteMoreBlogsSection}
            />
          </>
        )}

        {/* Footer Actions */}
        {!loading && !loadError && (
          <div className="w-full flex justify-end gap-4 mt-6">
            <button
              onClick={(): void => {
                void handleSaveDraft();
              }}
              disabled={isSaving}
              className={`px-6 py-3 rounded-lg outline-1 -outline-offset-1 outline-neutral-50 bg-transparent transition-colors text-neutral-50 ${
                isSaving ? "opacity-60 cursor-not-allowed" : "hover:bg-zinc-700/30"
              }`}
            >
              {isSaving ? "Saving..." : "Save & Preview"}
            </button>
            <button
              onClick={(): void => {
                void handlePublish();
              }}
              disabled={isSaving}
              className={`px-6 py-3 bg-linear-to-b from-[#501bd6] to-[#7f57e2] rounded-lg transition-transform text-white ${
                isSaving ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
            >
              {isSaving ? "Publishing..." : (isEditMode ? "Update Comparison Blog" : "Publish Comparison Blog")}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
