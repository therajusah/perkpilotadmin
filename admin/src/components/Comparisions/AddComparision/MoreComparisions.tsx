import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ChangeEvent,
} from "react";
import { ChevronDown, Trash, Loader2, X } from "lucide-react";
import ComparisionsGrid from "../../HomeManagement/ComparisionsGrid";
import type { ComparisonApiResponse } from "../../../types/api.types";
import fetchComparisions from "../../../hooks/useComparisions";

const MAX_SELECTED = 8;

type Props = {
  initialSectionTitle?: string;
  initialSelectedComparisons?: ComparisonApiResponse[];
  onSectionTitleChange?: (title: string) => void;
  onComparisonsChange?: (comparisons: ComparisonApiResponse[]) => void;
};

export default function MoreComparisions({
  initialSectionTitle = "",
  initialSelectedComparisons = [],
  onSectionTitleChange,
  onComparisonsChange,
}: Props): ReactElement {
  const [query, setQuery] = useState("");
  const [sectionTitle, setSectionTitle] = useState(initialSectionTitle);
  const [allComparisons, setAllComparisons] = useState<ComparisonApiResponse[]>([]);
  const [selectedComparisons, setSelectedComparisons] = useState<ComparisonApiResponse[]>(initialSelectedComparisons);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Track previous initial values to detect external changes
  const prevInitialComparisonsRef = useRef<string>("");
  const prevInitialTitleRef = useRef<string>("");

  // Update selected comparisons when initialSelectedComparisons changes externally
  useEffect(() => {
    const currentIds = initialSelectedComparisons.map(c => getComparisonId(c)).sort().join(',');
    
    // Only update if the initial comparisons actually changed externally
    if (currentIds !== prevInitialComparisonsRef.current) {
      setSelectedComparisons(initialSelectedComparisons);
      prevInitialComparisonsRef.current = currentIds;
    }
  }, [initialSelectedComparisons]);

  // Update section title when initialSectionTitle changes externally
  useEffect(() => {
    const currentTitle = initialSectionTitle || "";
    
    // Only update if the initial title actually changed externally
    if (currentTitle !== prevInitialTitleRef.current) {
      setSectionTitle(currentTitle);
      prevInitialTitleRef.current = currentTitle;
    }
  }, [initialSectionTitle]);

  // Notify parent when section title changes
  const prevSectionTitleRef = useRef<string>(sectionTitle);
  useEffect(() => {
    if (sectionTitle !== prevSectionTitleRef.current) {
      prevSectionTitleRef.current = sectionTitle;
      onSectionTitleChange?.(sectionTitle);
    }
  }, [sectionTitle, onSectionTitleChange]);

  // Notify parent when selected comparisons change 
  const prevSelectedComparisonsRef = useRef<ComparisonApiResponse[]>(selectedComparisons);
  useEffect(() => {
    const currentIds = selectedComparisons.map(c => getComparisonId(c)).sort().join(',');
    const prevIds = prevSelectedComparisonsRef.current.map(c => getComparisonId(c)).sort().join(',');
    
    if (currentIds !== prevIds) {
      prevSelectedComparisonsRef.current = selectedComparisons;
      onComparisonsChange?.(selectedComparisons);
    }
  }, [selectedComparisons, onComparisonsChange]);

  // Fetch comparisons on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadComparisons = async (): Promise<void> => {
      try {
        const data = await fetchComparisions();
        if (!isMounted) return;
        setAllComparisons(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load comparisons");
        setAllComparisons([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadComparisons();

    return () => {
      isMounted = false;
    };
  }, []); 

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!allComparisons.length) {
      return [];
    }
    const unselected = allComparisons.filter((comparison) => {
      const id = getComparisonId(comparison);
      return !selectedComparisons.some(
        (selected) => getComparisonId(selected) === id
      );
    });

    if (!normalizedQuery) {
      return unselected.slice(0, 6);
    }

    return unselected
      .filter((comparison) => {
        const title = (comparison.title ?? comparison.heroHeading ?? "").toLowerCase();
        const subtitle = (
          comparison.subtitle ?? comparison.sectionHeadline ?? ""
        ).toLowerCase();
        const description = (comparison.description ?? comparison.heroBody ?? "").toLowerCase();
        const slug = (comparison.slug ?? "").toLowerCase();
        return (
          title.includes(normalizedQuery) ||
          subtitle.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          slug.includes(normalizedQuery)
        );
      })
      .slice(0, 6);
  }, [allComparisons, normalizedQuery, selectedComparisons]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
    setShowResults(true);
  };

  const handleToggleSection = (): void => {
    setIsExpanded((prev) => !prev);
  };

  const handleDeleteSection = (): void => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      setSelectedComparisons([]);
      setSectionTitle("");
    }
  };

  const handleAddComparison = (comparison: ComparisonApiResponse): void => {
    setSelectedComparisons((prev) => {
      if (prev.some((item) => getComparisonId(item) === getComparisonId(comparison))) {
        return prev;
      }
      if (prev.length >= MAX_SELECTED) {
        return prev;
      }
      return [...prev, comparison];
    });
    setQuery("");
    setShowResults(false);
  };

  const handleRemoveComparison = (comparisonId: string): void => {
    setSelectedComparisons((prev) =>
      prev.filter((comparison) => getComparisonId(comparison) !== comparisonId)
    );
  };

  const mappedSelectedComparisons = useMemo(() => {
    if (!selectedComparisons.length) return [];
    return selectedComparisons.map((comparison) => mapComparisonForGrid(comparison));
  }, [selectedComparisons]);

  const maxSelectedReached = selectedComparisons.length >= MAX_SELECTED;

  return (
    <div
      data-layer="Frame 2147205992"
      className="Frame2147205992 self-stretch rounded-2xl inline-flex flex-col justify-start items-start gap-6"
    >
      <div
        data-layer="Frame 2147205981"
        className="Frame2147205981 self-stretch pb-4 border-b border-zinc-800 inline-flex justify-between items-center cursor-pointer"
        onClick={handleToggleSection}
      >
        <div
          data-layer="More Comparison Tools Blog"
          className="MoreComparisonToolsBlog justify-start text-neutral-50 text-xl font-medium font-['Poppins'] leading-8"
        >
          More Comparison Tools Blog
        </div>
        <ChevronDown
          className={`text-zinc-400 transition-transform duration-300 ${
            isExpanded ? "" : "rotate-180"
          }`}
        />
      </div>

      {isExpanded && (
        <>
          <div
            data-layer="Frame 2147206010"
            className="Frame2147206010 self-stretch inline-flex justify-start items-center gap-6 flex-wrap"
          >
            <div className="flex-1 flex flex-col gap-2 min-w-[260px]">
              <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
                Section Title
              </div>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e): void => setSectionTitle(e.target.value)}
                placeholder="e.g. Tools Face-Off – Which SaaS Reigns Supreme?"
                className="px-4 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] leading-6 outline-none focus:border-purple-500 placeholder:text-zinc-500"
              />
            </div>
            <button
              data-layer="Frame 2147205993"
              className="Frame2147205993 flex justify-start items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleDeleteSection}
            >
              <div className="text-[#e62f29] text-sm font-medium font-['Poppins']">
                Remove or Delete Section
              </div>
              <Trash className="text-red-500 w-4 h-4" />
            </button>
          </div>

          <div
            className="w-full relative bg-zinc-800 rounded-xl outline-1 -outline-offset-1 outline-zinc-700 px-3 py-2"
            ref={searchContainerRef}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                >
                  <path
                    d="M10.5404 19.2499C15.3498 19.2499 19.2487 15.3511 19.2487 10.5416C19.2487 5.73211 15.3498 1.83325 10.5404 1.83325C5.73088 1.83325 1.83203 5.73211 1.83203 10.5416C1.83203 15.3511 5.73088 19.2499 10.5404 19.2499Z"
                    stroke="#727A8F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.1654 20.1666L18.332 18.3333"
                    stroke="#727A8F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <input
                value={query}
                onChange={handleSearchChange}
                onFocus={(): void => setShowResults(true)}
                placeholder="Search comparison blogs to feature"
                className="bg-transparent outline-none text-neutral-50 placeholder:text-zinc-500 w-full"
                aria-label="Search comparison blogs"
              />
            </div>
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center gap-3 px-4 py-3 text-zinc-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading comparisons...
                  </div>
                ) : searchResults.length ? (
                  searchResults.map((comparison) => {
                    const comparisonId = getComparisonId(comparison);
                    const isSelected = selectedComparisons.some(
                      (item) => getComparisonId(item) === comparisonId
                    );
                    return (
                      <div
                        key={comparisonId}
                        className="px-4 py-3 hover:bg-zinc-800 transition-colors flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-neutral-50 text-sm font-medium">
                              {comparison.title ?? comparison.heroHeading ?? "Untitled comparison"}
                            </div>
                            <div className="text-zinc-400 text-xs">
                              {comparison.subtitle ?? comparison.sectionHeadline ?? comparison.slug ?? ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isSelected || maxSelectedReached}
                            onClick={(): void => handleAddComparison(comparison)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                : maxSelectedReached
                                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                : "bg-[#501bd6] text-white hover:bg-[#5d2ae0]"
                            }`}
                          >
                            {isSelected ? "Added" : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-zinc-400 text-sm">
                    No comparisons found for “{query}”.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="w-full p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-neutral-50 text-sm font-semibold font-['Poppins']">
                Selected Comparisons ({selectedComparisons.length}/{MAX_SELECTED})
              </div>
              {maxSelectedReached && (
                <div className="text-xs text-amber-400">
                  Maximum of {MAX_SELECTED} cards reached
                </div>
              )}
            </div>
            {selectedComparisons.length === 0 ? (
              <div className="text-zinc-400 text-sm">
                Use the search above to add comparison blogs to this section.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedComparisons.map((comparison) => {
                  const comparisonId = getComparisonId(comparison);
                  return (
                    <div
                      key={comparisonId}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-xs text-neutral-50"
                    >
                      <span className="line-clamp-1">
                        {comparison.title ?? comparison.heroHeading ?? comparison.slug ?? "Untitled"}
                      </span>
                      <button
                        type="button"
                        onClick={(): void => handleRemoveComparison(comparisonId)}
                        aria-label="Remove comparison"
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedComparisons.length > 0 ? (
            <ComparisionsGrid data={mappedSelectedComparisons} />
          ) : (
            <div className="w-full px-4 py-6 bg-zinc-900/40 border border-dashed border-zinc-700 rounded-2xl text-center text-zinc-400 text-sm">
              No comparisons selected yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getComparisonId(comparison: ComparisonApiResponse): string {
  return (
    comparison._id ??
    comparison.id ??
    comparison.slug ??
    comparison.heroHeading ??
    crypto.randomUUID()
  );
}

function mapComparisonForGrid(comparison: ComparisonApiResponse): ComparisonApiResponse {
  const app1 = comparison.toolsMentioned?.[0];
  const app2 = comparison.toolsMentioned?.[1];

  return {
    ...comparison,
    title: comparison.title ?? comparison.heroHeading ?? "Untitled Comparison",
    subtitle: comparison.subtitle ?? comparison.sectionHeadline ?? "",
    description: comparison.description ?? comparison.heroBody ?? "",
    app1Name: comparison.app1Name ?? app1?.toolName ?? comparison.heroHeading ?? "",
    app1Logo: comparison.app1Logo ?? app1?.toolLogo ?? "",
    app2Name: comparison.app2Name ?? app2?.toolName ?? "",
    app2Logo: comparison.app2Logo ?? app2?.toolLogo ?? "",
  };
}
