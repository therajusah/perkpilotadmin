import { useEffect, useState, type ReactElement } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Author from "../../components/Shared/Author";
import Header from "../../components/Comparisions/AddComparision/Header";
import Hero from "../../components/Shared/Hero";
import ToolsMentioned from "../../components/Shared/ToolsMentioned";
import ToolBlogCard from "../../components/Shared/ToolBlogCard";
import FeatureComparision from "../../components/Comparisions/AddComparision/FeatureComparision";
import ProConGrid from "../../components/Comparisions/AddComparision/ProConGrid";
import MoreComparisions from "../../components/Comparisions/AddComparision/MoreComparisions";
import FooterActions from "../../components/Comparisions/AddComparision/FooterActions";
import ComparisonModulesCard from "../../components/Comparisions/AddComparision/ComparisonModulesCard";
import { COMPARISIONS_API } from "../../config/backend";
import type {
  Tool,
  FeaturesData,
  ProsConsCard,
  ComparisonData,
  BlogModuleEntry,
} from "../../types/comparison.types";
import type { FeatureComparisonApiResponse, BlogSectionApiResponse, ComparisonApiResponse } from "../../types/api.types";
export default function UpdateComparisionPage(): ReactElement {
  const normalizeApiBlogModules = (modules: unknown): BlogModuleEntry[] => {
    if (!Array.isArray(modules)) {
      return [];
    }

    return modules
      .map((module, index) => {
        if (
          typeof module !== "object" ||
          module === null ||
          typeof (module as { moduleName?: unknown }).moduleName !== "string"
        ) {
          return null;
        }

        const moduleName = (module as { moduleName: string }).moduleName.trim();
        if (!moduleName) {
          return null;
        }

        const moduleNumberValue = (module as { moduleNumber?: unknown }).moduleNumber;
        const moduleNumber =
          typeof moduleNumberValue === "number" ? moduleNumberValue : index + 1;

        return {
          moduleNumber,
          moduleName,
        };
      })
      .filter((module): module is BlogModuleEntry => module !== null);
  };

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [blogModules, setBlogModules] = useState<BlogModuleEntry[]>([]);
  const [moreComparisonsTitle, setMoreComparisonsTitle] = useState<string>("");
  const [moreComparisons, setMoreComparisons] = useState<ComparisonApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No comparison ID provided");
      setLoading(false);
      return;
    }

    let mounted = true;
    (async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${COMPARISIONS_API}/${id}`);
        
        if (!response.ok) {
          const errorData = (await response.json().catch((): Record<string, unknown> => ({}))) as { message?: string };
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        const data = await response.json() as ComparisonApiResponse;
        if (!mounted) return;

        // Transform API response to ComparisonData format
        const normalizedBlogModules = normalizeApiBlogModules(data.blogModules);

        const transformedData: ComparisonData = {
          pageType: data.pageType || "Tool Comparison Blog",
          heroHeading: data.heroHeading || "",
          heroBody: data.heroBody || "",
          comparisonHeroImage: data.comparisonHeroImage || "https://via.placeholder.com/800x400?text=Comparison+Hero",
          sectionHeadline: data.sectionHeadline || "",
          tipBulbText: data.tipBulbText || "",
          toolsMentioned: data.toolsMentioned || [],
          authorId: typeof data.authorId === "string" ? data.authorId : (data.author || ""),
          blogCategory: data.blogCategory || "",
          readingTime: data.readingTime || "",
          toolBlogCards: data.toolBlogCards || [],
          featuresComparison: data.featuresComparison ? {
            sectionTitle: data.featuresComparison.sectionTitle || "",
            featuresHeadline: data.featuresComparison.featuresHeadline || "",
            tools: data.featuresComparison.tools || [],
            features: data.featuresComparison.features.map((f) => ({
              featureName: f.featureName,
              toolAvailability: {
                "0": f.tool1Available ?? false,
                "1": f.tool2Available ?? false,
                "2": f.tool3Available ?? false,
              },
            })),
          } : {
            sectionTitle: "",
            featuresHeadline: "",
            tools: [],
            features: [],
          },
          prosConsCards: data.prosConsCards || [],
          moreComparisonsSectionTitle: data.moreComparisonsSectionTitle || "",
          moreComparisons: Array.isArray(data.moreComparisons) 
            ? data.moreComparisons.map((comp: ComparisonApiResponse | string) => 
                typeof comp === "string" ? comp : (comp._id ?? comp.id ?? "")
              ).filter((id: string) => id !== "")
            : [],
          slug: data.slug || "",
          isPublished: data.isPublished ?? true,
        };

        setComparisonData(transformedData);
        setBlogModules(normalizedBlogModules);
        
        // Set more comparisons title
        setMoreComparisonsTitle(data.moreComparisonsSectionTitle || "");
        
        // Set initial more comparisons if they exist
        // Backend populates moreComparisons, so they should be full objects
        if (Array.isArray(data.moreComparisons) && data.moreComparisons.length > 0) {
          // Filter out string IDs and keep only populated objects
          const populatedComparisons = data.moreComparisons.filter(
            (comp): comp is ComparisonApiResponse => 
              typeof comp === "object" && comp !== null && !Array.isArray(comp)
          );
          if (populatedComparisons.length > 0) {
            setMoreComparisons(populatedComparisons);
          }
        }
      } catch (err) {
        console.error("Failed to load comparison:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load comparison";
        if (mounted) setError(errorMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return (): void => {
      mounted = false;
    };
  }, [id]);

  const handleHeroHeadingChange = (heading: string): void => {
    if (!comparisonData) return;
    const slug = heading
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setComparisonData((prev) => prev ? ({
      ...prev,
      heroHeading: heading,
      slug: slug,
    }) : null);
  };

  const handleHeroBodyChange = (body: string): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      heroBody: body,
    }) : null);
  };

  const handleToolsChange = (tools: Tool[]): void => {
    if (!comparisonData) return;
    const toolsMentioned = tools.map((tool) => ({
      toolName: tool.name || "",
      toolLogo: tool.logo || `https://via.placeholder.com/100?text=${tool.name || "Tool"}`,
      toolCategory: tool.category || "Tool",
      isVerified: false,
    }));
    setComparisonData((prev) => prev ? ({
      ...prev,
      toolsMentioned,
    }) : null);
  };

  const handleToolsHeadlineChange = (headline: string): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      sectionHeadline: headline,
    }) : null);
  };

  const handleTipChange = (tip: string): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      tipBulbText: tip,
    }) : null);
  };

  const handleAuthorChange = (authorId: string | undefined): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      authorId: authorId || "",
    }) : null);
  };

  const handleBlogCategoryChange = (category: string): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      blogCategory: category,
    }) : null);
  };

  const handleReadingTimeChange = (time: string): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      readingTime: time,
    }) : null);
  };

  const handleToolBlogCardsChange = (cards: BlogSectionApiResponse[]): void => {
    if (!comparisonData) return;
    const toolBlogCards = cards.map((card) => ({
      sectionNumber: card.sectionNumber,
      blogTitle: card.blogTitle,
      blogBody: card.blogBody,
    }));
    setComparisonData((prev) => prev ? ({
      ...prev,
      toolBlogCards,
    }) : null);
  };

  const handleHeroImageChange = (imageUrl: string): void => {
    if (!comparisonData) return;
    setComparisonData((prev) => prev ? ({
      ...prev,
      comparisonHeroImage: imageUrl || "https://via.placeholder.com/800x400?text=Comparison+Hero",
    }) : null);
  };

  const handleFeaturesChange = (featuresData: FeatureComparisonApiResponse): void => {
    if (!comparisonData) return;
    const transformedFeatures: FeaturesData = {
      sectionTitle: featuresData.sectionTitle,
      featuresHeadline: featuresData.featuresHeadline,
      tools: featuresData.tools,
      features: featuresData.features.map((f) => ({
        featureName: f.featureName,
        toolAvailability: {
          "0": f.tool1Available,
          "1": f.tool2Available,
          "2": f.tool3Available,
        },
      })),
    };
    setComparisonData((prev) => prev ? ({
      ...prev,
      featuresComparison: transformedFeatures,
    }) : null);
  };

  const handleProsConsChange = (prosConsData: ProsConsCard[]): void => {
    if (!comparisonData) return;
    const prosConsCards = prosConsData.map((item) => ({
      cardNumber: item.cardNumber,
      titlePros: item.titlePros,
      titleCons: item.titleCons,
      prosConsPairs: item.prosConsPairs,
    }));
    setComparisonData((prev) => prev ? ({
      ...prev,
      prosConsCards,
    }) : null);
  };

  const handleModulesChange = (modules: Array<{ id: string; name: string }>): void => {
    console.log("=== UpdatePage handleModulesChange called ===");
    console.log("Received modules:", modules);

    // Map all modules, including empty ones - let FooterActions filter them out during save
    const normalized: BlogModuleEntry[] = modules
      .map((m, index) => ({
        moduleNumber: index + 1,
        moduleName: m.name.trim(),
      }));

    console.log("Normalized modules:", normalized);
    setBlogModules(normalized);
  };

  const buildModuleCards = (modules: BlogModuleEntry[]): Array<{ id: string; name: string }> => {
    return modules.map((module) => ({
      id: `module-${module.moduleNumber}`,
      name: module.moduleName,
    }));
  };

  const handleSaveSuccess = (): void => {
    void Promise.resolve(navigate("/comparisons"));
  };

  const handleSaveError = (error: string): void => {
    console.error("Save error:", error);
  };

  const handleMoreComparisonsTitleChange = (title: string): void => {
    if (!comparisonData) return;
    setMoreComparisonsTitle(title);
    setComparisonData((prev) => prev ? ({
      ...prev,
      moreComparisonsSectionTitle: title,
    }) : null);
  };

  const handleMoreComparisonsChange = (comparisons: ComparisonApiResponse[]): void => {
    if (!comparisonData) return;
    setMoreComparisons(comparisons);
    // Extract IDs from comparisons
    const comparisonIds = comparisons.map((comp) => {
      return comp._id ?? comp.id ?? "";
    }).filter((id) => id !== "");
    
    setComparisonData((prev) => prev ? ({
      ...prev,
      moreComparisons: comparisonIds,
    }) : null);
  };

  // Transform tools for ToolsMentioned component
  const initialTools: Tool[] = comparisonData?.toolsMentioned?.map((tool, idx) => ({
    id: String(idx),
    name: tool.toolName,
    logo: tool.toolLogo,
    category: tool.toolCategory,
  })) || [];

  // Transform features for FeatureComparision component
  const initialFeatures: FeatureComparisonApiResponse | undefined = comparisonData?.featuresComparison ? {
    sectionTitle: comparisonData.featuresComparison.sectionTitle,
    featuresHeadline: comparisonData.featuresComparison.featuresHeadline,
    tools: comparisonData.featuresComparison.tools,
    features: comparisonData.featuresComparison.features.map((f) => ({
      featureName: f.featureName,
      tool1Available: f.toolAvailability["0"] ?? false,
      tool2Available: f.toolAvailability["1"] ?? false,
      tool3Available: f.toolAvailability["2"] ?? false,
    })),
  } : undefined;

  if (loading) {
    return (
      <div
        data-layer="Frame 2147206029"
        className="Frame2147206029 w-[1116px] p-6 bg-zinc-900 rounded-3xl outline-1 -outline-offset-1 outline-zinc-800 inline-flex flex-col justify-start items-start gap-6"
      >
        <div className="text-sm text-zinc-400">Loading comparison...</div>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <div
        data-layer="Frame 2147206029"
        className="Frame2147206029 w-[1116px] p-6 bg-zinc-900 rounded-3xl outline-1 -outline-offset-1 outline-zinc-800 inline-flex flex-col justify-start items-start gap-6"
      >
        <div className="text-sm text-red-400">{error || "Comparison not found"}</div>
      </div>
    );
  }

  const modulesForCard = buildModuleCards(blogModules);

  return (
    <div
      data-layer="Frame 2147206029"
      className="Frame2147206029 w-[1116px] p-6 bg-zinc-900 rounded-3xl outline-1 -outline-offset-1 outline-zinc-800 inline-flex flex-col justify-start items-start gap-6"
    >
      <Header 
        title="Update Comparison"
        onBack={() => {
          void Promise.resolve(navigate(-1));
        }} 
      />
      <Hero
        heading={comparisonData.heroHeading}
        body={comparisonData.heroBody}
        image={comparisonData.comparisonHeroImage}
        onHeadingChange={handleHeroHeadingChange}
        onBodyChange={handleHeroBodyChange}
        onImageChange={handleHeroImageChange}
      />
      <ToolsMentioned
        initialTools={initialTools}
        headline={comparisonData.sectionHeadline}
        tip={comparisonData.tipBulbText}
        onToolsChange={handleToolsChange}
        onHeadlineChange={handleToolsHeadlineChange}
        onTipChange={handleTipChange}
      />
      <Author
        initialAuthorId={comparisonData.authorId}
        initialCategory={comparisonData.blogCategory}
        initialReadingTime={comparisonData.readingTime}
        onAuthorChange={handleAuthorChange}
        onCategoryChange={handleBlogCategoryChange}
        onReadingTimeChange={handleReadingTimeChange}
      />
      <ComparisonModulesCard
        initialModules={modulesForCard.length > 0 ? modulesForCard : undefined}
        onModulesChange={handleModulesChange}
      />
      <ToolBlogCard
        initialCards={comparisonData.toolBlogCards.map((card) => ({
          sectionNumber: card.sectionNumber,
          blogTitle: card.blogTitle,
          blogBody: card.blogBody,
        }))}
        onCardsChange={handleToolBlogCardsChange}
      />
      <FeatureComparision
        initialData={initialFeatures}
        onFeaturesChange={handleFeaturesChange}
      />
      <ProConGrid
        initialProsConsCards={comparisonData.prosConsCards.map((card) => ({
          cardNumber: card.cardNumber,
          titlePros: card.titlePros,
          titleCons: card.titleCons,
          prosConsPairs: card.prosConsPairs,
        }))}
        onProsConsChange={handleProsConsChange}
      />
      <MoreComparisions
        initialSectionTitle={moreComparisonsTitle}
        initialSelectedComparisons={moreComparisons}
        onSectionTitleChange={handleMoreComparisonsTitleChange}
        onComparisonsChange={handleMoreComparisonsChange}
      />
      <FooterActions
        comparisonData={comparisonData}
        comparisonId={id}
        blogModules={blogModules}
        onSaveSuccess={handleSaveSuccess}
        onSaveError={handleSaveError}
      />
    </div>
  );
}

