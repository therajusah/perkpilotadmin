import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
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
import type {
  Tool,
  FeaturesData,
  ProsConsCard,
  ComparisonData,
  BlogModuleEntry,
} from "../../types/comparison.types";
import type { FeatureComparisonApiResponse, BlogSectionApiResponse, ComparisonApiResponse } from "../../types/api.types";

export default function AddComparisionPage(): ReactElement {
  const navigate = useNavigate();
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    pageType: "Tool Comparison Blog",
    heroHeading: "",
    heroBody: "",
    comparisonHeroImage:
      "https://via.placeholder.com/800x400?text=Comparison+Hero",
    sectionHeadline: "",
    tipBulbText: "",
    toolsMentioned: [],
    authorId: "",
    blogCategory: "",
    readingTime: "",
    toolBlogCards: [],
    featuresComparison: {
      sectionTitle: "",
      featuresHeadline: "",
      tools: [],
      features: [],
    },
    prosConsCards: [],
    slug: "",
    isPublished: true,
  });
  const [blogModules, setBlogModules] = useState<BlogModuleEntry[]>([]);
  const [moreComparisonsTitle, setMoreComparisonsTitle] = useState<string>("");
  const [moreComparisons, setMoreComparisons] = useState<ComparisonApiResponse[]>([]);

  const handleHeroHeadingChange = (heading: string): void => {
    const slug = heading
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setComparisonData((prev) => ({
      ...prev,
      heroHeading: heading,
      slug: slug,
    }));
  };

  const handleHeroBodyChange = (body: string): void => {
    setComparisonData((prev) => ({
      ...prev,
      heroBody: body,
    }));
  };

  const handleToolsChange = (tools: Tool[]): void => {
    const toolsMentioned = tools.map((tool) => ({
      toolName: tool.name || "",
      toolLogo:
        tool.logo ||
        `https://via.placeholder.com/100?text=${tool.name || "Tool"}`,
      toolCategory: tool.category || "Tool",
      isVerified: false,
    }));
    setComparisonData((prev) => ({
      ...prev,
      toolsMentioned,
    }));
  };

  const handleToolsHeadlineChange = (headline: string): void => {
    setComparisonData((prev) => ({
      ...prev,
      sectionHeadline: headline,
    }));
  };

  const handleTipChange = (tip: string): void => {  
    setComparisonData((prev) => ({
      ...prev,
      tipBulbText: tip,
    }));
  };

  const handleAuthorChange = (authorId: string | undefined): void => {
    setComparisonData((prev) => ({
      ...prev,
      authorId: authorId || "",
    }));
  };

  const handleBlogCategoryChange = (category: string): void => {
    setComparisonData((prev) => ({
      ...prev,
      blogCategory: category,
    }));
  };

  const handleReadingTimeChange = (time: string): void => {
    setComparisonData((prev) => ({
      ...prev,
      readingTime: time,
    }));
  };

  const handleToolBlogCardsChange = (cards: BlogSectionApiResponse[]): void => {
    const toolBlogCards = cards.map((card) => ({
      sectionNumber: card.sectionNumber,
      blogTitle: card.blogTitle,
      blogBody: card.blogBody,
    }));
    setComparisonData((prev) => ({
      ...prev,
      toolBlogCards,
    }));
  };

  const handleHeroImageChange = (imageUrl: string): void => {
    setComparisonData((prev) => ({
      ...prev,
      comparisonHeroImage:
        imageUrl || "https://via.placeholder.com/800x400?text=Comparison+Hero",
    }));
  };

  const handleFeaturesChange = (featuresData: FeatureComparisonApiResponse): void => {
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
    setComparisonData((prev) => ({
      ...prev,
      featuresComparison: transformedFeatures,
    }));
  };

  const handleProsConsChange = (prosConsData: ProsConsCard[]): void => {
    console.log("Received pros/cons data:", prosConsData);

    const prosConsCards = prosConsData.map((item) => ({
      cardNumber: item.cardNumber,
      titlePros: item.titlePros,
      titleCons: item.titleCons,
      prosConsPairs: item.prosConsPairs,
    }));

    console.log("Transformed pros/cons cards:", prosConsCards);

    setComparisonData((prev) => ({
      ...prev,
      prosConsCards,
    }));
  };

  const handleModulesChange = (modules: Array<{ id: string; name: string }>): void => {
    console.log("=== handleModulesChange called ===");
    console.log("Received modules:", modules);
    
    const normalized: BlogModuleEntry[] = modules
      .filter((m) => m.name.trim().length > 0)
      .map((m, index) => ({
        moduleNumber: index + 1,
        moduleName: m.name.trim(),
      }));
    
    console.log("Normalized modules:", normalized);
    setBlogModules(normalized);
  };

  const handleMoreComparisonsTitleChange = (title: string): void => {
    setMoreComparisonsTitle(title);
    setComparisonData((prev) => ({
      ...prev,
      moreComparisonsSectionTitle: title,
    }));
  };

  const handleMoreComparisonsChange = (comparisons: ComparisonApiResponse[]): void => {
    setMoreComparisons(comparisons);
    const comparisonIds = comparisons
      .map((comp: ComparisonApiResponse): string => {
        return comp._id ?? comp.id ?? "";
      })
      .filter((id: string): id is string => id !== "");
    
    setComparisonData((prev) => ({
      ...prev,
      moreComparisons: comparisonIds,
    }));
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

  const modulesForCard = buildModuleCards(blogModules);

  return (
    <div
      data-layer="Frame 2147206029"
      className="Frame2147206029 w-[1116px] p-6 bg-zinc-900 rounded-3xl outline-1 -outline-offset-1 outline-zinc-800 inline-flex flex-col justify-start items-start gap-6"
    >
      <Header onBack={() => {
        void Promise.resolve(navigate(-1));
      }} />
      <Hero
        onHeadingChange={handleHeroHeadingChange}
        onBodyChange={handleHeroBodyChange}
        onImageChange={handleHeroImageChange}
      />
      <ToolsMentioned
        onToolsChange={handleToolsChange}
        onHeadlineChange={handleToolsHeadlineChange}
        onTipChange={handleTipChange}
      />
      <Author
        onAuthorChange={handleAuthorChange}
        onCategoryChange={handleBlogCategoryChange}
        onReadingTimeChange={handleReadingTimeChange}
      />
      <ComparisonModulesCard
        initialModules={modulesForCard.length > 0 ? modulesForCard : undefined}
        onModulesChange={handleModulesChange}
      />
      <ToolBlogCard onCardsChange={handleToolBlogCardsChange} />
      <FeatureComparision onFeaturesChange={handleFeaturesChange} />
      <ProConGrid onProsConsChange={handleProsConsChange} />
      <MoreComparisions
        initialSectionTitle={moreComparisonsTitle}
        initialSelectedComparisons={moreComparisons}
        onSectionTitleChange={handleMoreComparisonsTitleChange}
        onComparisonsChange={handleMoreComparisonsChange}
      />
      <FooterActions
        comparisonData={comparisonData}
        blogModules={blogModules}
        onSaveSuccess={handleSaveSuccess}
        onSaveError={handleSaveError}
      />
    </div>
  );
}
