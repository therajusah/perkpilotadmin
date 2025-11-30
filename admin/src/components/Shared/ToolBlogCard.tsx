import { Plus, X, GripVertical } from "lucide-react";
import { useState, useEffect, useRef, type ReactElement } from "react";
import { uploadToCloudinary } from "../../config/cloudinary";
import { DEALS_API } from "../../config/backend";
import type { BlogSectionApiResponse, ToolApiResponse, DealApiResponse } from "../../types/api.types";
import BlogBodyEditor from "./BlogBodyEditor";

type CardWithId = BlogSectionApiResponse & { id: number };

type Props = {
  onCardsChange?: (cards: BlogSectionApiResponse[]) => void;
  initialCards?: BlogSectionApiResponse[];
};

let idCounter = Date.now();

export default function ToolBlogCard({ onCardsChange, initialCards }: Props): ReactElement {
  const [cards, setCards] = useState<CardWithId[]>(() => {
    if (initialCards && initialCards.length > 0) {
      return initialCards.map((card, index) => ({
        ...card,
        id: index + 1,
        sectionNumber: card.sectionNumber ?? index + 1,
      }));
    }
    return [];
  });

  const onCardsChangeRef = useRef(onCardsChange);
  const hasInitializedRef = useRef(false);
  const previousInitialCardsRef = useRef<string>("");
  const isSyncingFromInitialRef = useRef(false);
  
  useEffect((): void => {
    onCardsChangeRef.current = onCardsChange;
  }, [onCardsChange]);

  // Sync cards state when initialCards changes (e.g., after refresh/API load)
  // This ensures real data from API is loaded instead of demo data
  // Only update if initialCards actually changed (deep comparison via JSON stringify)
  useEffect((): void => {
    const currentInitialCardsStr = JSON.stringify(initialCards || []);
    
    // Skip if initialCards hasn't actually changed
    if (previousInitialCardsRef.current === currentInitialCardsStr) {
      return;
    }
    
    previousInitialCardsRef.current = currentInitialCardsStr;
    isSyncingFromInitialRef.current = true;
    
    if (initialCards && initialCards.length > 0) {
      const newCards = initialCards.map((card, index) => ({
        ...card,
        id: index + 1,
        sectionNumber: card.sectionNumber ?? index + 1,
      }));
      setCards(newCards);
      hasInitializedRef.current = true;
    } else if (initialCards && initialCards.length === 0) {
      // If initialCards is explicitly empty array, clear cards
      setCards([]);
      hasInitializedRef.current = true;
    } else if (!initialCards && hasInitializedRef.current) {
      // Reset flag if initialCards becomes undefined (e.g., new form)
      hasInitializedRef.current = false;
      setCards([]);
    }
    
    // Reset sync flag after state update
    setTimeout(() => {
      isSyncingFromInitialRef.current = false;
    }, 0);
  }, [initialCards]);

  // Only notify parent of changes, but skip if we're currently syncing from initialCards
  useEffect((): void => {
    // Skip notification if we're syncing from initialCards to prevent infinite loop
    if (isSyncingFromInitialRef.current) {
      return;
    }
    
    // Skip the first render notification to prevent initial loop
    if (!hasInitializedRef.current) {
      return;
    }
    
    const mappedCards: BlogSectionApiResponse[] = cards.map(({ id: _id, ...rest }) => rest);
    onCardsChangeRef.current?.(mappedCards);
  }, [cards]);

  const handleAddCard = (): void => {
    const newId = ++idCounter;
    const newCard: CardWithId = {
      id: newId,
      sectionNumber: cards.length + 1,
      blogTitle: "",
      blogBody: "",
      dealsMentioned: [],
    };
    setCards([...cards, newCard]);
  };

  const handleDeleteCard = (id: number): void => {
    const filtered = cards.filter((card): boolean => card.id !== id);
    const renumbered = filtered.map((card, index) => ({
      ...card,
      sectionNumber: index + 1
    }));
    setCards(renumbered);
  };

  const handleChange = (id: number, field: string, value: string): void => {
    setCards(
      cards.map((card) => {
        if (card.id === id) {
          if (field === "title") {
            return { ...card, blogTitle: value };
          } else if (field === "body") {
            return { ...card, blogBody: value };
          } else if (field === "note") {
            return { ...card, additionalNote: value };
          }
        }
        return card;
      })
    );
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="Frame2147205999 self-stretch inline-flex justify-between items-center">
        <div className="ToolBlogCards flex-1 justify-start text-neutral-50 text-xl font-medium font-['Poppins'] leading-8">
          Tool Blog Cards
        </div>

        <div
          className="Frame2147205993 flex justify-start items-center gap-3 cursor-pointer"
          onClick={handleAddCard}
        >
          <div className="AddMoreToolBlogCard justify-start text-neutral-50 text-sm font-medium font-['Poppins']">
            Add More Tool Blog Card
          </div>
          <div className="IcRoundPlus w-6 h-6 relative overflow-hidden">
            <Plus className="text-zinc-400 w-6 h-6" />
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-zinc-400 text-sm text-center py-8">
          No tool blog cards yet. Click "Add More Tool Blog Card" to add one.
        </div>
      ) : (
        cards.map((card) => (
        <div
          key={card.id}
          className="Frame2147205990 self-stretch bg-zinc-800 rounded-3xl   inline-flex flex-col justify-start items-start gap-6"
        >
          <div className="Row self-stretch p-4 bg-zinc-800 rounded-tl-xl rounded-tr-xl outline-1 outline-zinc-700 inline-flex justify-between items-center overflow-hidden">
            <div className="Frame2147206052 self-stretch flex justify-start items-center gap-6">
              <div className="Column self-stretch py-3 rounded-xl inline-flex flex-col justify-center items-start gap-3">
                <div className="Frame2147205991 inline-flex justify-start items-center">
                  <div className="CharmMenuKebab w-6 h-6 relative overflow-hidden">
                    <div className="Vector w-[2.25px] h-[2.25px] left-[10.88px] top-[2.62px] absolute outline-[1.50px] outline-offset-[-0.75px] outline-neutral-50" />
                    <div className="Vector w-[2.25px] h-[2.25px] left-[10.88px] top-[10.88px] absolute outline-[1.50px] outline-offset-[-0.75px] outline-neutral-50" />
                    <div className="Vector w-[2.25px] h-[2.25px] left-[10.88px] top-[19.12px] absolute outline-[1.50px] outline-offset-[-0.75px] outline-neutral-50" />
                  </div>
                </div>
              </div>
              <div className="BlogSectionOne justify-start text-neutral-50 text-xl font-medium font-['Poppins'] leading-8">
                Blog Section {(() => {
                  const num = card.sectionNumber ?? 1;
                  if (num === 1) return "One";
                  if (num === 2) return "Two";
                  if (num === 3) return "Three";
                  if (num === 4) return "Four";
                  if (num === 5) return "Five";
                  return String(num);
                })()}
              </div>
            </div>

            <div className="Frame2147206053 self-stretch flex justify-start items-center gap-6">
              <button
                type="button"
                className="FluentDelete16Regular w-6 h-6 relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e): void => {
                  e.stopPropagation();
                  handleDeleteCard(card.id);
                }}
                title="Delete card"
                aria-label="Delete card"
              >
                <X className="text-zinc-400 w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="Frame2147206054 self-stretch px-4 pb-4 flex flex-col justify-start items-start gap-6">
            <div className="Frame214720559 self-stretch flex flex-col justify-center items-start gap-3">
              <div className="BlogTitle text-neutral-50 text-sm font-medium font-['Poppins']">
                Blog Title
              </div>
              <input
                type="text"
                placeholder="Enter blog heading"
                value={card.blogTitle}
                onChange={(e) => handleChange(card.id, "title", e.target.value)}
                className="self-stretch h-14 px-4 py-3 bg-zinc-800 rounded-xl outline-1 outline-zinc-700 text-neutral-50 font-normal font-['Poppins'] text-base placeholder:text-zinc-500"
              />
            </div>

            <div className="Frame2147205563 self-stretch flex flex-col justify-center items-start gap-3">
              <BlogBodyEditor
                initialBody={card.blogBody || ""}
                onBodyChange={(body) => handleChange(card.id, "body", body)}
                label="Blog Body Text Editor"
                 />
            </div>

            <SearchAndAddDeal
              selectedDeals={
                (card.dealsMentioned || [])
                  .filter((deal) => {
                    if (!deal || typeof deal !== 'object') return false;
                    // Check if it's in DealApiResponse format (has title)
                    if ('title' in deal) return Boolean(deal.title);
                    // Check if it's in backend format (has toolName)
                    if ('toolName' in deal) return Boolean((deal as { toolName?: string }).toolName);
                    return false;
                  })
                  .map((deal) => {
                    // Handle DealApiResponse format (title, logoUri, category)
                    if (deal && typeof deal === 'object' && 'title' in deal) {
                      const apiDeal: DealApiResponse = deal;
                      return {
                        toolName: apiDeal.title || "",
                        toolLogo: apiDeal.logoUri || apiDeal.logoComponent || "",
                        toolCategory: apiDeal.category || apiDeal.tag || "Tool",
                        isVerified: apiDeal.verified ?? false,
                      };
                    }
                    // Handle backend format (toolName, toolLogo, toolCategory)
                    if (deal && typeof deal === 'object' && 'toolName' in deal) {
                      const backendDeal = deal as { toolName: string; toolLogo: string; toolCategory: string; isVerified?: boolean };
                      return {
                        toolName: backendDeal.toolName || "",
                        toolLogo: backendDeal.toolLogo || "",
                        toolCategory: backendDeal.toolCategory || "Tool",
                        isVerified: backendDeal.isVerified ?? false,
                      };
                    }
                    // Fallback
                    return {
                      toolName: "",
                      toolLogo: "",
                      toolCategory: "Tool",
                      isVerified: false,
                    };
                  })
                  .filter((tool) => tool.toolName) // Only include deals with a name
              }
              onDealsChange={(tools): void => {
                const deals: DealApiResponse[] = tools.map((tool) => ({
                  title: tool.toolName || "",
                  logoUri: tool.toolLogo || "",
                  category: tool.toolCategory || "Tool",
                  verified: tool.isVerified || false,
                }));
                setCards((prevCards) =>
                  prevCards.map((c) =>
                    c.id === card.id ? { ...c, dealsMentioned: deals } : c
                  )
                );
              }}
            />

            <ImageUpload
              imageUrl={card.blogImage}
              
              onImageChange={(imageUrl): void => {
                setCards(
                  cards.map((c) =>
                    c.id === card.id ? { ...c, blogImage: imageUrl } : c
                  )
                );
              }}
            />
          </div>
        </div>
        ))
      )}
    </div>
  );
}

function SearchAndAddDeal({
  selectedDeals,
  onDealsChange,
}: {
  selectedDeals: ToolApiResponse[];
  onDealsChange: (deals: ToolApiResponse[]) => void;
}): ReactElement {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DealApiResponse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

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
        const response = await fetch(`${DEALS_API}?q=${encodeURIComponent(query)}`, {
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          setLoading(false);
          setSearchResults([]);
          setShowResults(false);
          return;
        }
        
        const data = await response.json() as DealApiResponse[] | { data: DealApiResponse[] };
        const deals = Array.isArray(data) ? data : (data.data ?? []);
        setSearchResults(deals.slice(0, 5));
        setShowResults(true);
      } catch (error) {
        // Ignore AbortError from cancelled requests
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching deals:", error);
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

  const handleAddDeal = (deal: DealApiResponse): void => {
    const tool: ToolApiResponse = {
      toolName: deal.title || "",
      toolLogo: deal.logoUri || "",
      toolCategory: deal.category || deal.tag || "Tool",
      isVerified: deal.verified || false,
    };

    const exists = selectedDeals.some(
      (d) => d.toolName.toLowerCase() === tool.toolName.toLowerCase()
    );
    if (exists) {
      setQuery("");
      setShowResults(false);
      return;
    }

    onDealsChange([...selectedDeals, tool]);
    setQuery("");
    setShowResults(false);
  };

  const handleRemoveDeal = (toolName: string): void => {
    const normalizedName = toolName.toLowerCase().trim();
    onDealsChange(selectedDeals.filter((d) => d.toolName.toLowerCase().trim() !== normalizedName));
  };

  return (
    <div className="self-stretch flex flex-col justify-center items-start gap-3">
      <div className="self-stretch relative">
        <div className="self-stretch relative bg-zinc-800 rounded-xl outline-1 -outline-offset-1 outline-zinc-700 px-3 py-3">
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
              onChange={(e): void => setQuery(e.target.value)}
              onFocus={(): void => setShowResults(true)}
              placeholder="Search & Add Deal Mentioned in this blog"
              className="bg-transparent outline-none text-neutral-50 placeholder:text-zinc-500 w-full"
              aria-label="Search deals"
            />
          </div>
        </div>

        {showResults && (query.trim() || searchResults.length > 0) && (
          <div className="absolute top-full mt-2 w-full bg-zinc-800 rounded-xl outline-1 outline-zinc-700 shadow-lg z-10 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 text-zinc-400 text-sm">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((deal) => (
                <button
                  key={deal._id || deal.id}
                  type="button"
                  onClick={(): void => handleAddDeal(deal)}
                  className="w-full text-left px-4 py-2 hover:bg-zinc-700 transition-colors flex items-center gap-3"
                >
                  {deal.logoUri && (
                    <img
                      src={deal.logoUri}
                      alt={deal.title || "Deal"}
                      className="w-8 h-8 object-contain rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-neutral-50 text-sm font-medium">
                      {deal.title || "Untitled Deal"}
                    </div>
                    <div className="text-zinc-400 text-xs">
                      {deal.category || deal.tag || "Deal"}
                    </div>
                  </div>
                </button>
              ))
            ) : query.trim() ? (
              <div className="px-4 py-2 text-zinc-400 text-sm">No deals found</div>
            ) : null}
          </div>
        )}
      </div>

      {selectedDeals.length > 0 && (
        <div className="self-stretch flex flex-row gap-4 flex-wrap">
          {selectedDeals.map((deal, index) => (
            <div
              key={`${deal.toolName}-${index}`}
              className="Card self-stretch h-[88px] px-4 bg-zinc-800 rounded-3xl outline-1 outline-zinc-700 inline-flex justify-start items-center gap-4"
            >
              <div className="Frame2147205991 flex justify-start items-center">
                <GripVertical className="text-zinc-400 w-6 h-6" />
              </div>
              <div className="Frame1321320236 flex-1 py-4 inline-flex flex-row justify-start items-start gap-3">
                <div className="Frame1321320234 self-stretch inline-flex justify-between items-center">
                  <div className="Frame1321320238 flex-1 flex justify-start items-center gap-3">
                    <div className="Frame1321320234 w-14 h-14 p-2.5 bg-gray-50 rounded-[100px] flex justify-center items-center gap-2.5">
                      {deal.toolLogo ? (
                        <img
                          src={deal.toolLogo}
                          alt={deal.toolName}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-zinc-700 rounded" />
                      )}
                    </div>
                    <div className="Frame1321320233 inline-flex flex-col justify-start items-start gap-1">
                      <div className="Frame2147205849 inline-flex justify-start items-center gap-2">
                        <div className="Motion justify-start text-neutral-50 text-xl font-medium font-['Urbanist']">
                          {deal.toolName}
                        </div>
                        {deal.isVerified && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M15.9178 5.64301C15.7799 5.42265 15.5767 5.25077 15.3365 5.15129C15.0964 5.05181 14.8311 5.02969 14.5778 5.08801L12.7798 5.50101C12.5955 5.54336 12.4041 5.54336 12.2198 5.50101L10.4218 5.08801C10.1685 5.02969 9.90326 5.05181 9.66308 5.15129C9.42291 5.25077 9.21972 5.42265 9.08181 5.64301L8.10181 7.20701C8.00181 7.36701 7.86681 7.50201 7.70681 7.60301L6.14281 8.58301C5.92283 8.7208 5.7512 8.92366 5.65174 9.16342C5.55229 9.40319 5.52994 9.66797 5.58781 9.92101L6.00081 11.721C6.04301 11.905 6.04301 12.0961 6.00081 12.28L5.58781 14.079C5.52972 14.3322 5.55195 14.5972 5.65142 14.8372C5.75088 15.0771 5.92264 15.2802 6.14281 15.418L7.70681 16.398C7.86681 16.498 8.00181 16.633 8.10281 16.793L9.08281 18.357C9.36481 18.808 9.90281 19.031 10.4218 18.912L12.2198 18.499C12.4041 18.4567 12.5955 18.4567 12.7798 18.499L14.5788 18.912C14.832 18.9701 15.097 18.9479 15.337 18.8484C15.5769 18.7489 15.78 18.5772 15.9178 18.357L16.8978 16.793C16.9978 16.633 17.1328 16.498 17.2928 16.398L18.8578 15.418C19.078 15.28 19.2497 15.0767 19.349 14.8365C19.4483 14.5964 19.4702 14.3312 19.4118 14.078L18.9998 12.28C18.9575 12.0957 18.9575 11.9043 18.9998 11.72L19.4128 9.92101C19.471 9.66792 19.4489 9.403 19.3496 9.16304C19.2504 8.92308 19.0788 8.72 18.8588 8.58201L17.2938 7.60201C17.134 7.50183 16.999 7.36679 16.8988 7.20701L15.9178 5.64301ZM15.4148 9.77001C15.4767 9.65628 15.492 9.52298 15.4576 9.39818C15.4231 9.27338 15.3416 9.16679 15.2302 9.10085C15.1188 9.03491 14.9862 9.01476 14.8602 9.04463C14.7342 9.0745 14.6248 9.15206 14.5548 9.26101L11.9398 13.687L10.3608 12.175C10.314 12.1269 10.2579 12.0887 10.196 12.0628C10.1341 12.0368 10.0676 12.0236 10.0004 12.0239C9.93329 12.0242 9.8669 12.038 9.80522 12.0645C9.74353 12.091 9.68781 12.1296 9.64139 12.1781C9.59497 12.2267 9.55879 12.284 9.53501 12.3468C9.51124 12.4096 9.50035 12.4765 9.503 12.5436C9.50566 12.6107 9.52179 12.6766 9.55045 12.7373C9.57911 12.798 9.6197 12.8523 9.66981 12.897L11.7038 14.846C11.7582 14.8981 11.8237 14.9371 11.8954 14.9603C11.9671 14.9835 12.043 14.9902 12.1177 14.9799C12.1923 14.9697 12.2636 14.9426 12.3263 14.9009C12.389 14.8592 12.4415 14.8039 12.4798 14.739L15.4148 9.77001Z"
                              fill="#FAFAFA"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="ProductiveTool justify-start text-zinc-400 text-xs font-medium font-['Poppins']">
                        {deal.toolCategory}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <X
                className="text-zinc-400 w-6 h-6 cursor-pointer hover:text-red-400 transition-colors"
                onClick={(): void => handleRemoveDeal(deal.toolName)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUpload({
  imageUrl,
  onImageChange,
}: {
  imageUrl?: string;
  onImageChange: (url: string) => void;
}): ReactElement {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    setError(null);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 95;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);
      onImageChange(cloudinaryUrl);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveImage = (): void => {
    onImageChange("");
    setFileName(null);
    setProgress(0);
  };

  return (
    <div className="self-stretch flex flex-col justify-center items-start gap-3">
      <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
        Image
      </div>
      {!imageUrl && !uploading && (
        <label className="self-stretch h-14 px-4 py-3 bg-zinc-800 rounded-xl outline-1 outline-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 20C4.47717 20 0 15.5228 0 10C0 4.47717 4.47717 0 10 0C15.5228 0 20 4.47717 20 10C20 15.5228 15.5228 20 10 20ZM10 2.17392C5.67718 2.17392 2.17392 5.67827 2.17392 10C2.17392 14.3218 5.67718 17.8261 10 17.8261C14.3228 17.8261 17.8261 14.3218 17.8261 10C17.8261 5.67827 14.3228 2.17392 10 2.17392ZM11.9565 14.1848H8.04347V9.73913H5.59783L10 5.59783L14.4022 9.73913H11.9565V14.1848Z"
              fill="#FAFAFA"
            />
          </svg>
          <span className="text-neutral-50 text-sm font-medium font-['Poppins']">
            Upload
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e): void => {
              void handleFileSelect(e);
            }}
          />
        </label>
      )}

      {(uploading || fileName) && (
        <div className="self-stretch flex flex-col gap-2">
          <div className="self-stretch flex items-center justify-between">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              {fileName}
            </div>
            {uploading && (
              <div className="text-zinc-400 text-xs">
                {Math.round(progress)}%
              </div>
            )}
            {!uploading && imageUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-red-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {uploading && (
            <div className="self-stretch h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-b from-[#501BD6] to-[#7F57E2] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {error && (
            <div className="text-red-400 text-xs">{error}</div>
          )}
        </div>
      )}

      {imageUrl && !uploading && (
        <div className="self-stretch relative">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-48 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
