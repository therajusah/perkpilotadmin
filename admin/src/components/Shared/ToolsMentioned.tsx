import { X, GripVertical } from "lucide-react";
import { useEffect, useState, useRef, type ReactElement } from "react";
import { DEALS_API } from "../../config/backend";

type Tool = {
  id: string;
  name: string;
  logo?: string;
  category?: string;
};

type Props = {
  headline?: string;
  tip?: string;
  searchPlaceholder?: string;
  initialTools?: Tool[];
  showSearch?: boolean;
  onToolsChange?: (tools: Tool[]) => void;
  onHeadlineChange?: (v: string) => void;
  onTipChange?: (v: string) => void;
};

export default function ToolsMentioned({
  headline = "",
  tip = "",
  initialTools = [],
  onToolsChange,
  onHeadlineChange,
  onTipChange,
  showSearch = true,
  searchPlaceholder = "Search tools",
}: Props): ReactElement{
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [query, setQuery] = useState("");
  const [headlineState, setHeadlineState] = useState(headline);
  const [tipState, setTipState] = useState(tip);
  const [searchResults, setSearchResults] = useState<Array<{ _id?: string; id?: string; title: string; logoUri?: string; category?: string; tag?: string; verified?: boolean }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null); 
  const normalizeTools = (toolList: Tool[]): Array<{ name: string; logo?: string; category?: string }> => {
    return toolList.map((t) => ({
      name: t.name,
      logo: t.logo,
      category: t.category,
    }));
  };

  const prevInitialToolsRef = useRef<string>(JSON.stringify(normalizeTools(initialTools)));
  const isInitialMountRef = useRef(true);
  const onToolsChangeRef = useRef(onToolsChange);
  const toolsRef = useRef<Tool[]>(tools);

  useEffect((): void => {
    onToolsChangeRef.current = onToolsChange;
  }, [onToolsChange]);

  useEffect((): void => {
    toolsRef.current = tools;
  }, [tools]);

  useEffect((): void => {
    const currentStr = JSON.stringify(normalizeTools(initialTools));
    const prevStr = prevInitialToolsRef.current;
    

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevInitialToolsRef.current = currentStr;
      setTools(initialTools);
      return;
    }
    
    if (currentStr !== prevStr) {
      const currentToolsNormalized = JSON.stringify(normalizeTools(toolsRef.current));
      if (currentToolsNormalized !== currentStr) {
        prevInitialToolsRef.current = currentStr;
        setTools(initialTools);
      } else {
        prevInitialToolsRef.current = currentStr;
      }
    }
  }, [initialTools]);

  useEffect((): void => {
    if (isInitialMountRef.current) return;
    onToolsChangeRef.current?.(tools);
  }, [tools]);
  useEffect((): void => setHeadlineState(headline), [headline]);
  useEffect((): void => setTipState(tip), [tip]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await fetch(`${DEALS_API}?q=${encodeURIComponent(query)}&_t=${Date.now()}`, {
          signal: abortController.signal,
          cache: "no-cache",
        });
        
        if (!response.ok) {
          setLoading(false);
          setSearchResults([]);
          setShowResults(false);
          return;
        }
        
        const data = await response.json() as Array<{ _id?: string; id?: string; title: string; logoUri?: string; category?: string; tag?: string; verified?: boolean }> | { data: Array<{ _id?: string; id?: string; title: string; logoUri?: string; category?: string; tag?: string; verified?: boolean }> };
        const deals = Array.isArray(data) ? data : (data.data ?? []);
        setSearchResults(deals.slice(0, 5));
        setShowResults(true);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching tools:", error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showResults]);

  function addToolFromSearch(deal: { title: string; logoUri?: string; category?: string; tag?: string; verified?: boolean }): void {
    const trimmed = deal.title.trim();
    if (!trimmed) return;
    const exists = tools.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setQuery("");
      setShowResults(false);
      return;
    }
    const next: Tool = {
      id: trimmed,
      name: trimmed,
      logo: deal.logoUri,
      category: deal.category || deal.tag || "Tool",
    };
    setTools((s) => [...s, next]);
    setQuery("");
    setShowResults(false);
  }

  function addTool(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = tools.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setQuery("");
      setShowResults(false);
      return;
    }
    const next: Tool = {
      id: trimmed,
      name: trimmed,
    };
    setTools((s) => [...s, next]);
    setQuery("");
    setShowResults(false);
  }

  function removeTool(id: string): void {
    setTools((s) => s.filter((t): boolean => t.id !== id));
  }

  function updateToolLogo(id: string, logo: string): void {
    setTools((s) => s.map((t) => (t.id === id ? { ...t, logo } : t)));
  }

  function updateToolCategory(id: string, category: string): void {
    setTools((s) => s.map((t) => (t.id === id ? { ...t, category } : t)));
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") addTool(query);
  }

  return (
    <>
      <div
        data-layer="Frame 2147205994"
        className="Frame2147205994 self-stretch inline-flex justify-between items-center"
      >
        <div
          data-layer="Tools Mentioned"
          className="ToolsMentioned flex-1 justify-start text-neutral-50 text-xl font-medium font-['Poppins'] leading-8"
        >
          Tools Mentioned
        </div>
      </div>
      <div
        data-layer="Frame 2147205993"
        className="Frame2147205993 self-stretch p-4 bg-zinc-800 rounded-2xl flex flex-col justify-start items-start gap-6"
      >
        <div
          data-layer="Frame 2147223609"
          className="Frame2147223609 self-stretch inline-flex justify-start items-center gap-6"
        >
          <div
            data-layer="Frame 2147205989"
            className="Frame2147205989 flex-1 flex justify-start items-start gap-6"
          >
            <div
              data-layer="Frame 2147205559"
              className="Frame2147205559 flex-1 inline-flex flex-col justify-center items-start gap-3"
            >
              <div
                data-layer="Section Headline"
                className="SectionHeadline justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
              >
                Section Headline
              </div>
              <div
                data-layer="Input"
                className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center flex-wrap content-center overflow-hidden"
              >
                <div
                  data-layer="Frame 13"
                  className="Frame13 left-[16px] top-[16px] absolute flex justify-start items-center gap-3 w-full"
                >
                  <div
                    data-layer="Frame 1171275453"
                    className="Frame1171275453 flex justify-start items-center w-full"
                  >
                    <input
                      aria-label="Section headline"
                      placeholder=""
                      value={headlineState}
                      onChange={(e): void => {
                        setHeadlineState(e.target.value);
                        onHeadlineChange?.(e.target.value);
                      }}
                      className="w-full bg-transparent text-neutral-50 text-base font-normal font-['Poppins'] leading-6 outline-none placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              data-layer="Frame 2147205562"
              className="Frame2147205562 flex-1 inline-flex flex-col justify-center items-start gap-3"
            >
              <div
                data-layer="Tip Bulb Text"
                className="TipBulbText justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
              >
                Tip Bulb Text
              </div>
              <div
                data-layer="Input"
                className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center flex-wrap content-center overflow-hidden"
              >
                <div
                  data-layer="Frame 13"
                  className="Frame13 left-[16px] top-[16px] absolute flex justify-start items-center gap-3 w-full"
                >
                  <div
                    data-layer="Frame 1171275453"
                    className="Frame1171275453 flex justify-start items-center w-full"
                  >
                    <input
                      aria-label="Tip text"
                      placeholder=""
                      value={tipState}
                      onChange={(e): void => {
                        setTipState(e.target.value);
                        onTipChange?.(e.target.value);
                      }}
                      className="w-full bg-transparent text-neutral-50 text-base font-normal font-['Poppins'] leading-6 outline-none placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSearch && (
          <div
            data-layer="Frame 1171275919"
            className="Frame1171275919 w-full h-12 flex justify-start items-center gap-6"
            ref={searchRef}
          >
            <div
              data-layer="Main/text-field"
              className="MainTextField flex-1 self-stretch relative bg-zinc-800 rounded-xl  outline-zinc-700 inline-flex flex-col justify-center items-start gap-2.5"
            >
              <div className="self-stretch relative bg-zinc-800 rounded-xl outline-1 -outline-offset-1 outline-zinc-700 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded flex items-center justify-center">
                    {/* simple search circle visual (keeps original look) */}
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
                    </svg>{" "}
                  </div>
                  <input
                    value={query}
                    onChange={(e): void => setQuery(e.target.value)}
                    onKeyDown={onKey}
                    placeholder={searchPlaceholder || "Search deals to add as tools..."}
                    className="bg-transparent outline-none text-neutral-50 placeholder:text-zinc-500 w-full"
                    aria-label={searchPlaceholder || "Search deals to add as tools"}
                  />
                  {loading && (
                    <div className="text-zinc-400 text-xs">Searching...</div>
                  )}
                </div>
              </div>
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((deal, index) => {
                    const isSelected = tools.some(
                      (t) => t.name.toLowerCase() === deal.title.toLowerCase()
                    );
                    return (
                      <div
                        key={`search-tool-${deal._id || deal.id || deal.title || index}-${index}`}
                        onClick={(): void => {
                          if (!isSelected) {
                            addToolFromSearch(deal);
                          }
                        }}
                        className={`px-4 py-3 hover:bg-zinc-700 cursor-pointer flex items-center gap-3 ${
                          isSelected ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {deal.logoUri && (
                          <img
                            src={deal.logoUri}
                            alt={deal.title}
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-neutral-50 text-sm font-medium">
                            {deal.title}
                          </div>
                          {(deal.category || deal.tag) && (
                            <div className="text-zinc-400 text-xs">
                              {deal.category || deal.tag}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="text-zinc-500 text-xs">Already added</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 self-stretch w-full">
          {tools.map((tool, index) => (
            <div
              key={`tool-${tool.id || tool.name || index}-${index}`}
              data-layer="Card"
              className="Card self-stretch w-full h-[88px] px-4 bg-zinc-800 rounded-3xl outline-1 outline-zinc-700 inline-flex justify-start items-center gap-4"
            >
              {/* Drag Handle */}
              <GripVertical className="text-zinc-400 w-6 h-6 cursor-grab shrink-0" />
              
              {/* Logo Container */}
              <div className="w-14 h-14 p-2.5 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                {tool.logo ? (
                  <img
                    src={tool.logo}
                    alt={`${tool.name} logo`}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 relative overflow-hidden flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#005eea] rounded" />
                  </div>
                )}
              </div>
              
              {/* Tool Name and Category */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-neutral-50 text-xl font-medium font-['Urbanist'] truncate">
                    {tool.name || "Unknown Tool"}
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                    className="shrink-0"
                        >
                          <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                            d="M15.4163 5.64301C15.2784 5.42265 15.0752 5.25077 14.8351 5.15129C14.5949 5.05181 14.3297 5.02969 14.0763 5.08801L12.2783 5.50101C12.0941 5.54336 11.9026 5.54336 11.7183 5.50101L9.92034 5.08801C9.66701 5.02969 9.40179 5.05181 9.16162 5.15129C8.92144 5.25077 8.71826 5.42265 8.58034 5.64301L7.60034 7.20701C7.50034 7.36701 7.36534 7.50201 7.20534 7.60301L5.64134 8.58301C5.42136 8.7208 5.24973 8.92366 5.15028 9.16342C5.05082 9.40319 5.02848 9.66797 5.08634 9.92101L5.49934 11.721C5.54154 11.905 5.54154 12.0961 5.49934 12.28L5.08634 14.079C5.02825 14.3322 5.05049 14.5972 5.14995 14.8372C5.24942 15.0771 5.42117 15.2802 5.64134 15.418L7.20534 16.398C7.36534 16.498 7.50034 16.633 7.60134 16.793L8.58134 18.357C8.86334 18.808 9.40134 19.031 9.92034 18.912L11.7183 18.499C11.9026 18.4567 12.0941 18.4567 12.2783 18.499L14.0773 18.912C14.3305 18.9701 14.5955 18.9479 14.8355 18.8484C15.0755 18.7489 15.2785 18.5772 15.4163 18.357L16.3963 16.793C16.4963 16.633 16.6313 16.498 16.7913 16.398L18.3563 15.418C18.5765 15.28 18.7482 15.0767 18.8475 14.8365C18.9468 14.5964 18.9688 14.3312 18.9103 14.078L18.4983 12.28C18.456 12.0957 18.456 11.9043 18.4983 11.72L18.9113 9.92101C18.9695 9.66792 18.9474 9.403 18.8482 9.16304C18.7489 8.92308 18.5773 8.72 18.3573 8.58201L16.7923 7.60201C16.6326 7.50183 16.4975 7.36679 16.3973 7.20701L15.4163 5.64301ZM14.9133 9.77001C14.9752 9.65628 14.9905 9.52298 14.9561 9.39818C14.9217 9.27338 14.8402 9.16679 14.7288 9.10085C14.6174 9.03491 14.4847 9.01476 14.3587 9.04463C14.2328 9.0745 14.1233 9.15206 14.0533 9.26101L11.4383 13.687L9.85934 12.175C9.8125 12.1269 9.75645 12.0887 9.69453 12.0628C9.63262 12.0368 9.56611 12.0236 9.49897 12.0239C9.43183 12.0242 9.36544 12.038 9.30375 12.0645C9.24206 12.091 9.18635 12.1296 9.13993 12.1781C9.0935 12.2267 9.05733 12.284 9.03355 12.3468C9.00977 12.4096 8.99889 12.4765 9.00154 12.5436C9.00419 12.6107 9.02033 12.6766 9.04899 12.7373C9.07764 12.798 9.11824 12.8523 9.16834 12.897L11.2023 14.846C11.2568 14.8981 11.3223 14.9371 11.3939 14.9603C11.4656 14.9835 11.5416 14.9902 11.6162 14.9799C11.6908 14.9697 11.7621 14.9426 11.8248 14.9009C11.8875 14.8592 11.94 14.8039 11.9783 14.739L14.9133 9.77001Z"
                            fill="#FAFAFA"
                          />
                        </svg>
                      </div>
                <div className="text-zinc-400 text-xs font-medium font-['Poppins']">
                  {tool.category || "Productive Tool"}
                </div>
              </div>
              
              {/* Logo and Category Inputs (Hidden by default, shown on hover or click) */}
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={tool.logo || ""}
                    onChange={(e): void => updateToolLogo(tool.id, e.target.value)}
                    placeholder="Logo URL"
                    className="h-8 px-2 py-1 bg-zinc-700 rounded text-xs text-neutral-50 placeholder:text-zinc-500 outline-none"
                  />
                  <input
                    type="text"
                    value={tool.category || ""}
                    onChange={(e): void =>
                      updateToolCategory(tool.id, e.target.value)
                    }
                    placeholder="Category"
                    className="h-8 px-2 py-1 bg-zinc-700 rounded text-xs text-neutral-50 placeholder:text-zinc-500 outline-none"
                  />
                </div>
              
              {/* Remove Button */}
              <X
                className="text-zinc-400 w-6 h-6 cursor-pointer hover:text-red-400 transition-colors shrink-0"
                onClick={(): void => removeTool(tool.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
