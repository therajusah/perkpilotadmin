import {useState, useEffect, type ChangeEvent, type FormEvent,type ReactElement} from "react";
import { useNavigate } from "react-router-dom";
import FooterActions from "./FooterActions";
import { Plus, Star } from "lucide-react";
import { DEALS_API } from "../../../config/backend";
import { fetchLogoByDomain } from "../../../utils/LogoFetch";
import type { DealApiResponse, ApiError } from "../../../types/api.types";
import CategorySelector from "../../Shared/CategorySelector";
import { authenticatedPost } from "../../../utils/api";
export default function Hero({
  reviewId,
  create,
}: {
  reviewId?: string;
  create?: boolean;
}): ReactElement{
  const navigate = useNavigate();
  const [loadingDeal, setLoadingDeal] = useState(false);

  useEffect(() => {
    if (!reviewId) {
      if (create) console.log("Hero running in create mode");
      return;
    }

    let mounted = true;

    void (async (): Promise<void> => {
      setLoadingDeal(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`${DEALS_API}/${reviewId}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as ApiError | { message?: string };
          throw new Error(body.message || `Server returned ${res.status}`);
        }
        const data = await res.json() as DealApiResponse;
        if (!mounted) return;
        const primaryCtaTextValue = typeof data.primary_cta_text === "string" ? data.primary_cta_text : undefined;
        const secondaryCtaTextValue = typeof data.secondary_cta_text === "string" ? data.secondary_cta_text : undefined;
        const primaryCtaLinkValue = typeof data.primary_cta_link === "string" ? data.primary_cta_link : undefined;
        const secondaryCtaLinkValue = typeof data.secondary_cta_link === "string" ? data.secondary_cta_link : undefined;
        
        setFormData((prev) => ({
          ...prev,
          toolName: typeof data.title === "string" ? data.title : prev.toolName,
          toolCategory: typeof data.category === "string" ? data.category : prev.toolCategory,
          toolDescription: typeof data.description === "string" ? data.description : prev.toolDescription,
          dealBadge: typeof data.tag === "string" ? data.tag : prev.dealBadge,
          rating:
            data.rating !== undefined && data.rating !== null
              ? String(data.rating)
              : prev.rating,
          features:
            Array.isArray(data.features) && data.features.length > 0
              ? data.features
              : prev.features,
          saveUptoAmount:
            data.savingsAmount !== undefined && data.savingsAmount !== null
              ? String(data.savingsAmount)
              : prev.saveUptoAmount,
          discountValue:
            data.discountPercentage !== undefined &&
            data.discountPercentage !== null
              ? String(data.discountPercentage)
              : prev.discountValue,
          primaryCtaText: primaryCtaTextValue ?? prev.primaryCtaText,
          secondaryCtaText: secondaryCtaTextValue ?? prev.secondaryCtaText,
          primaryCtaLink: primaryCtaLinkValue ?? prev.primaryCtaLink,
          secondaryCtaLink: secondaryCtaLinkValue ?? prev.secondaryCtaLink,
        }));

        // If server provided a logo URI, place it into logoFiles[0]
        if (data.logoUri) {
          setLogoFiles([data.logoUri, null, null]);
          setSelectedLogo(0);
        }
      } catch (err) {
        console.error("Failed to fetch deal:", err);
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load deal data";
          setErrorMessage(errorMessage);
        }
      } finally {
        if (mounted) setLoadingDeal(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [reviewId, create]);
  type FormDataShape = {
    toolName: string;
    toolCategory: string;
    toolDescription: string;
    dealBadge: string;
    rating: string;
    whatsIncludedTitle: string;
    features: string[];
    saveUptoAmount: string;
    saveUptoUnit: string;
    discountValue: string;
    discountUnit: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    // New fields
    showProductUsedBy: boolean;
    showAverageRating: boolean;
    productUsedByText: string;
    averageRating: number;
    averageRatingText: string;
    totalUsers: string;
    founded: string;
    employees: string;
    headquarters: string;
  };

  const [formData, setFormData] = useState<FormDataShape>({
    toolName: "",
    toolCategory: "",
    toolDescription: "",
    dealBadge: "",
    rating: "",
    whatsIncludedTitle: "",
    features: ["", ""],
    saveUptoAmount: "1080",
    saveUptoUnit: "Upto",
    discountValue: "20",
    discountUnit: "%",
    primaryCtaText: "",
    primaryCtaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    // New field defaults
    showProductUsedBy: true,
    showAverageRating: false,
    productUsedByText: "",
    averageRating: 0,
    averageRatingText: "",
    totalUsers: "",
    founded: "",
    employees: "",
    headquarters: "",
  });

  const [selectedLogo, setSelectedLogo] = useState<number>(0);
  const [logoFiles, setLogoFiles] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [logoFetchUrl, setLogoFetchUrl] = useState<string>("");
  const [logoFetching, setLogoFetching] = useState<boolean>(false);
  const [logoFetchError, setLogoFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle input changes for all text fields
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target as HTMLInputElement & HTMLSelectElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle feature input changes
  const handleFeatureChange = (index: number, value: string): void => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData((prev) => ({
      ...prev,
      features: updatedFeatures,
    }));
  };

  // Add new feature field
  const addFeature = (): void => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  // Remove feature field
  const removeFeature = (index: number): void => {
    if (formData.features.length > 1) {
      const updatedFeatures = formData.features.filter((_, i): boolean => i !== index);
      setFormData((prev) => ({
        ...prev,
        features: updatedFeatures,
      }));
    }
  };

  // Handle logo selection
  const handleLogoSelect = (index: number): void => {
    setSelectedLogo(index);
  };

  // Handle logo file upload
  const handleLogoUpload = (
    index: number,
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const file = e.target.files?.[0];
    if (file) {
      const newLogoFiles = [...logoFiles];
      newLogoFiles[index] = URL.createObjectURL(file);
      setLogoFiles(newLogoFiles);
      setSelectedLogo(index);
    }
  };

  // Handle logo fetch from domain
  const handleFetchLogo = async (): Promise<void> => {
    if (!logoFetchUrl.trim()) {
      setLogoFetchError("Please enter a domain or company name");
      return;
    }

    setLogoFetching(true);
    setLogoFetchError(null);

    try {
      const logoUrl = await fetchLogoByDomain(logoFetchUrl.trim());
      if (logoUrl) {
        const newLogoFiles = [...logoFiles];
        newLogoFiles[selectedLogo] = logoUrl;
        setLogoFiles(newLogoFiles);
        setLogoFetchUrl("");
      } else {
        setLogoFetchError(
          "Logo not found. Please try another domain or upload manually."
        );
      }
    } catch (error) {
      setLogoFetchError(
        error instanceof Error
          ? error.message
          : "Failed to fetch logo. Please try again."
      );
    } finally {
      setLogoFetching(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Basic client-side validation (use trimmed values to avoid whitespace-only input)
    const name = (formData.toolName ?? "").toString().trim();
    const category = (formData.toolCategory ?? "").toString().trim();
    const description = (formData.toolDescription ?? "").toString().trim();

    if (!name || !category || !description) {
      setErrorMessage(
        "Please fill in the required fields: Tool Name, Category and Description."
      );
      // helpful debug info for devs (view in browser console)
       
      console.debug("AddDeal validation failed", {
        name,
        category,
        description,
      });
      return;
    }

    (async (): Promise<void> => {
      setSubmitting(true);
      try {
        // Build payload to match backend Deal model
        const payload = {
          name: formData.toolName,
          category: formData.toolCategory,
          description: formData.toolDescription,
          features: formData.features.filter(
            (f) => typeof f === "string" && f.trim() !== ""
          ),
          // numeric fields
          discountPercentage: Number(formData.discountValue) || 0,
          savingsAmount: Number(formData.saveUptoAmount) || 0,
          tag: formData.dealBadge || null,
          rating: formData.rating ? Number(formData.rating) : null,
          logoUri: logoFiles[0] || null,
          verified: false,
          // CTA fields (backend expects snake_case)
          primary_cta_text: formData.primaryCtaText || null,
          secondary_cta_text: formData.secondaryCtaText || null,
          primary_cta_link: formData.primaryCtaLink || null,
          secondary_cta_link: formData.secondaryCtaLink || null,
        };

        const data = await authenticatedPost<DealApiResponse>(`${DEALS_API}/`, payload);
        setSuccessMessage("Deal created successfully.");
        console.log("Created deal:", data);
        
        // Navigate to deals list page after successful creation
        setTimeout(() => {
          void navigate("/deals");
        }, 1500);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Failed to create deal";
        setErrorMessage(errorMessage);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        data-layer="Frame 2147223610"
        className="Frame2147223610 w-[1068px] rounded-2xl inline-flex flex-col justify-start items-center gap-6"
      >
        {/* Tool Name and Category */}
        <div
          data-layer="Frame 2147206050"
          className="Frame2147206050 self-stretch inline-flex justify-start items-center gap-6"
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
                data-layer="Tool Name"
                className="ToolName justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
              >
                Tool Name
              </div>
              <div
                data-layer="Input"
                className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
              >
                <input
                  type="text"
                  name="toolName"
                  value={formData.toolName}
                  onChange={handleInputChange}
                  placeholder="Tool Name"
                  className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div
              data-layer="Frame 2147205562"
              className="Frame2147205562 flex-1 inline-flex flex-col justify-center items-start gap-3"
            >
              <div
                data-layer="Tool Category"
                className="ToolCategory justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
              >
                Tool Category
              </div>
              <CategorySelector
                value={formData.toolCategory}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    toolCategory: value,
                  }));
                }}
                placeholder="Select or type custom category"
                name="toolCategory"
              />
            </div>
          </div>
        </div>

        {/* Tool Description and Logo */}
        <div
          data-layer="Frame 2147206054"
          className="Frame2147206054 self-stretch inline-flex justify-start items-start gap-6"
        >
          <div
            data-layer="Frame 2147205559"
            className="Frame2147205559 flex-1 inline-flex flex-col justify-center items-start gap-3"
          >
            <div
              data-layer="Tool Description"
              className="ToolDescription justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
            >
              Tool Description
            </div>
            <div
              data-layer="Input"
              className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
            >
              <input
                type="text"
                name="toolDescription"
                value={formData.toolDescription}
                onChange={handleInputChange}
                placeholder="E.g. The collaborative user interface design tool."
                className="w-full bg-transparent outline-none text-neutral-50 placeholder:text-zinc-500 text-base font-normal font-['Plus_Jakarta_Sans'] leading-6"
              />
            </div>
            <div
              data-layer="The main button for users to proceed with the tool"
              className="TheMainButtonForUsersToProceedWithTheTool justify-start text-neutral-50 text-[10px] font-medium font-['Poppins']"
            >
              The main button for users to proceed with the tool
            </div>
          </div>

          <div
            data-layer="Frame 2147205564"
            className="Frame2147205564 flex-1 inline-flex flex-col justify-center items-start gap-3"
          >
            <div
              data-layer="Product Logo Select"
              className="ProductLogoSelect w-[272px] justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
            >
              Product Logo Select
            </div>
            <div
              data-layer="Frame 2147223625"
              className="Frame2147223625 inline-flex justify-start items-center gap-6"
            >
              {[0, 1, 2].map((index) => (
                <div key={index} className="relative">
                  <input
                    type="file"
                    id={`logo-${index}`}
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(index, e)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`logo-${index}`}
                    className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer ${
                      selectedLogo === index
                        ? "border-2 border-[#501bd6]"
                        : "border border-zinc-700"
                    } ${logoFiles[index] ? "" : "bg-zinc-800"}`}
                    onClick={(): void => handleLogoSelect(index)}
                  >
                    {logoFiles[index] ? (
                      <img
                        src={logoFiles[index]}
                        alt={`Logo ${index + 1}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-zinc-500 text-xs">+</span>
                    )}
                  </label>
                </div>
              ))}
            </div>

            {/* Logo Fetch Input */}
            <div className="w-full mt-4 flex flex-col gap-2">
              <div className="text-neutral-50 text-xs font-medium font-['Poppins']">
                Or fetch from domain
              </div>
              <div className="flex gap-2">
                <div
                  data-layer="Input"
                  className="Input flex-1 h-10 px-3 py-2 relative bg-zinc-800 rounded-lg outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
                >
                  <input
                    type="text"
                    value={logoFetchUrl}
                    onChange={(e) => setLogoFetchUrl(e.target.value)}
                    placeholder="e.g., google.com"
                    className="w-full bg-transparent outline-none text-neutral-50 text-sm font-normal font-['Poppins']"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchLogo}
                  disabled={logoFetching}
                  className="px-4 py-2 bg-[#501bd6] hover:bg-[#6030e8] disabled:opacity-50 text-neutral-50 text-sm font-medium rounded-lg transition-colors"
                >
                  {logoFetching ? "Fetching..." : "Fetch"}
                </button>
              </div>
              {logoFetchError && (
                <div className="text-red-400 text-xs font-medium">
                  {logoFetchError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deal Badge and Rating */}
        <div
          data-layer="Frame 2147206055"
          className="Frame2147206055 self-stretch inline-flex justify-start items-center gap-6"
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
                data-layer="Deal Badge"
                className="DealBadge justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
              >
                Deal Badge
              </div>
              <div
                data-layer="Input"
                className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
              >
                <input
                  type="text"
                  name="dealBadge"
                  value={formData.dealBadge}
                  onChange={handleInputChange}
                  placeholder="E.g. Hot Deals"
                  className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div
              data-layer="Frame 2147205562"
              className="Frame2147205562 flex-1 inline-flex flex-col justify-center items-start gap-3"
            >
              <div
                data-layer="Star Rating"
                className="StarRating justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
              >
                Star Rating
              </div>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={(): void => {
                      setFormData((prev) => ({
                        ...prev,
                        rating: prev.rating === String(star) ? "" : String(star),
                      }));
                    }}
                    className="hover:scale-110 transition-transform"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= Number(formData.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-neutral-50"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div
                data-layer="Helper text"
                className="HelperText justify-start text-neutral-50 text-[10px] font-medium font-['Poppins']"
              >
                Click to select a star rating (1-5)
              </div>
            </div>
          </div>
        </div>

        {/* What's Included Section */}
        <div
          data-layer="Frame 2147205560"
          className="Frame2147205560 self-stretch flex flex-col justify-center items-start gap-2"
        >
          <div
            data-layer="Whats Included Section Title"
            className="WhatsIncludedSectionTitle justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
          >
            Whats Included Section Title
          </div>
          <div
            data-layer="Input"
            className="Input self-stretch h-12 pl-6 pr-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
          >
            <input
              type="text"
              name="whatsIncludedTitle"
              value={formData.whatsIncludedTitle}
              onChange={handleInputChange}
              placeholder="Whats Included?"
              className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Dynamic Features */}
        {formData.features.map((feature, index) => (
          <div
            key={index}
            data-layer="Frame 2147205560"
            className="Frame2147205560 self-stretch flex flex-col justify-center items-start gap-2"
          >
            <div className="flex w-full items-center gap-3">
              <div
                data-layer="Input"
                className="Input flex-1 h-12 pl-6 pr-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
              >
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder={`Feature ${index + 1}`}
                  className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
                />
              </div>
              {formData.features.length > 1 && (
                <button
                  type="button"
                  onClick={(): void => removeFeature(index)}
                  className="text-red-500 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add More Features Button */}
        <div
          data-layer="Frame 2147205993"
          className="Frame2147205993 self-stretch inline-flex justify-end items-center gap-3"
        >
          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div
              data-layer="Add More Pros & Cons"
              className="AddMoreProsCons justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
            >
              Add More Features
            </div>
            <Plus size={16} className="text-neutral-50" />
          </button>
        </div>

        {/* Money Save Section */}
        <div
          data-layer="Frame 2147205562"
          className="Frame2147205562 self-stretch flex flex-col justify-center items-start gap-3"
        >
          <div
            data-layer="Money Save Upto"
            className="MoneySaveUpto justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
          >
            Money Save Upto
          </div>
          <div
            data-layer="Frame 2147205986"
            className="Frame2147205986 self-stretch inline-flex justify-start items-start"
          >
            <div
              data-layer="Input"
              className="Input flex-1 h-14 px-4 py-3 bg-zinc-900 outline-1 -outline-offset-0.5 outline-zinc-700 flex justify-start items-center"
            >
              <input
                type="number"
                name="saveUptoAmount"
                value={formData.saveUptoAmount}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
              />
            </div>
            <div
              data-layer="Input"
              className="Input w-[124px] h-14 px-4 py-3 bg-zinc-800 rounded-tr-xl rounded-br-xl outline-1 -outline-offset-0.5 outline-zinc-700 flex justify-between items-center overflow-hidden"
            >
              <select
                name="saveUptoUnit"
                value={formData.saveUptoUnit}
                onChange={handleInputChange}
                className="bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
              >
                <option value="Upto">Upto</option>
                <option value="Flat">Flat</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discount Section */}
        <div
          data-layer="Frame 2147223609"
          className="Frame2147223609 self-stretch flex flex-col justify-center items-start gap-3"
        >
          <div
            data-layer="Discount"
            className="Discount justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
          >
            Discount
          </div>
          <div
            data-layer="Frame 2147205986"
            className="Frame2147205986 self-stretch inline-flex justify-start items-start"
          >
            <div
              data-layer="Input"
              className="Input w-[114px] h-14 px-4 py-3 bg-zinc-800 rounded-tl-xl rounded-bl-xl outline-1 -outline-offset-0.5 outline-zinc-700 flex justify-start items-center overflow-hidden"
            >
              <div className="justify-start text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500">
                Discount
              </div>
            </div>
            <div
              data-layer="Input"
              className="Input flex-1 h-14 px-4 py-3 bg-zinc-900 outline-1 -outline-offset-0.5 outline-zinc-700 flex justify-start items-center"
            >
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6"
              />
            </div>
            <div
              data-layer="Input"
              className="Input w-[124px] h-14 px-4 py-3 bg-zinc-800 rounded-tr-xl rounded-br-xl outline-1 -outline-offset-0.5 outline-zinc-700 flex justify-between items-center overflow-hidden"
            >
              <select
                name="discountUnit"
                value={formData.discountUnit}
                onChange={handleInputChange}
                className="bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6"
              >
                <option value="%">%</option>
                <option value="$">$</option>
              </select>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div
          data-layer="Frame 2147223608"
          className="Frame2147223608 self-stretch inline-flex justify-start items-start gap-6"
        >
          <div
            data-layer="Frame 2147205559"
            className="Frame2147205559 flex-1 inline-flex flex-col justify-center items-start gap-3"
          >
            <div
              data-layer="Primary CTA Button Text"
              className="PrimaryCtaButtonText justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
            >
              Primary CTA Button Text
            </div>
            <div
              data-layer="Input"
              className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
            >
              <input
                type="text"
                name="primaryCtaText"
                value={formData.primaryCtaText}
                onChange={handleInputChange}
                placeholder="e.g., Get Notion"
                className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
              />
            </div>
            <div
              data-layer="The main button for users to proceed with the tool"
              className="TheMainButtonForUsersToProceedWithTheTool justify-start text-neutral-50 text-[10px] font-medium font-['Poppins']"
            >
              The main button for users to proceed with the tool
            </div>
          </div>

          <div
            data-layer="Frame 2147205563"
            className="Frame2147205563 flex-1 inline-flex flex-col justify-center items-start gap-3"
          >
            <div
              data-layer="Primary CTA Button Link"
              className="PrimaryCtaButtonLink justify-start text-neutral-50 text-sm font-medium font-['Poppins'] placeholder:text-zinc-500"
            >
              Primary CTA Button Link
            </div>
            <div
              data-layer="Input"
              className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
            >
              <input
                type="url"
                name="primaryCtaLink"
                value={formData.primaryCtaLink}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div
          data-layer="Frame 2147223607"
          className="Frame2147223607 self-stretch inline-flex justify-start items-start gap-6"
        >
          <div
            data-layer="Frame 2147205559"
            className="Frame2147205559 flex-1 inline-flex flex-col justify-center items-start gap-3"
          >
            <div
              data-layer="Secondary CTA Button Text"
              className="SecondaryCtaButtonText justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
            >
              Secondary CTA Button Text
            </div>
            <div
              data-layer="Input"
              className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
            >
              <input
                type="text"
                name="secondaryCtaText"
                value={formData.secondaryCtaText}
                onChange={handleInputChange}
                placeholder="e.g., Get Motion"
                className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
              />
            </div>
            <div
              data-layer="The main button for users to proceed with the tool"
              className="TheMainButtonForUsersToProceedWithTheTool justify-start text-zinc-400 text-[10px] font-medium font-['Poppins']"
            >
              The main button for users to proceed with the tool
            </div>
          </div>

          <div
            data-layer="Frame 2147205563"
            className="Frame2147205563 flex-1 inline-flex flex-col justify-center items-start gap-3"
          >
            <div
              data-layer="Primary CTA Button Link"
              className="PrimaryCtaButtonLink justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
            >
              Secondary CTA Button Link
            </div>
            <div
              data-layer="Input"
              className="Input self-stretch h-14 px-4 py-3 relative bg-zinc-800 rounded-xl outline-1 -outline-offset-0.5 outline-zinc-700 inline-flex justify-start items-center"
            >
              <input
                type="url"
                name="secondaryCtaLink"
                value={formData.secondaryCtaLink}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full bg-transparent outline-none text-neutral-50 text-base font-normal font-['Poppins'] leading-6 placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Success / Error messages */}
        {errorMessage && (
          <div className="w-full text-left text-sm text-red-400 mt-2">
            {errorMessage}
          </div>
        )}
        {loadingDeal && (
          <div className="w-full text-left text-sm text-zinc-400 mt-2">
            Loading deal...
          </div>
        )}
        {submitting && (
          <div className="w-full text-left text-sm text-zinc-400 mt-2">
            Submitting...
          </div>
        )}
        {successMessage && (
          <div className="w-full text-left text-sm text-emerald-400 mt-2">
            {successMessage}
          </div>
        )}

        <FooterActions />
      </div>
    </form>
  );
}
