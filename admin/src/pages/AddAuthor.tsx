import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { uploadToCloudinary } from "../config/cloudinary";
import { AUTHORS_API } from "../config/backend";
import type { AuthorFormData, AuthorData } from "../types/author.types";
import { authenticatedPost } from "../utils/api";

export default function AddAuthor(): ReactElement {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AuthorFormData>({
    authorTitle: "",
    authorName: "",
    authorIndustry: "",
    authorViewProfileURL: "",
    authorDescription: "",
    authorImageURL: "",
    authorXAccount: "",
    authorIGAccount: "",
    authorLinkedinAccount: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const imageUrl = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        authorImageURL: imageUrl, 
      }));
    } catch {
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = (): void => {
    void Promise.resolve(navigate(-1));
  };

  const handleSave = async (): Promise<void> => {
    setSaveError(null);
    setSaving(true);

    // Validate required fields
    if (
      !formData.authorTitle ||
      !formData.authorName ||
      !formData.authorIndustry ||
      !formData.authorViewProfileURL ||
      !formData.authorDescription
    ) {
      setSaveError(
        "Please fill in all required fields: Title, Name, Industry, Profile URL, and Description"
      );
      setSaving(false);
      return;
    }

    // Backend expects authorImageURL (all caps URL)
    const authorData: AuthorData = { ...formData };

    try {
      await authenticatedPost(AUTHORS_API, authorData);
      void Promise.resolve(navigate(-1));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save author";
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-[1116px] p-6 bg-zinc-900 rounded-3xl outline-1 -outline-offset-1 outline-zinc-800 flex flex-col gap-6">
        {/* Header */}
        <div className="text-neutral-50 text-2xl font-semibold font-['Poppins']">
          Author Create
        </div>

        {/* Author Title and Name Row */}
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author Title
            </div>
            <input
              type="text"
              name="authorTitle"
              value={formData.authorTitle}
              onChange={handleInputChange}
              placeholder="About The Author"
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author Name
            </div>
            <input
              type="text"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
        </div>

        {/* Author Industry and View Profile URL Row */}
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author Industry
            </div>
            <input
              type="text"
              name="authorIndustry"
              value={formData.authorIndustry}
              onChange={handleInputChange}
              placeholder="Fintech SaaS"
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author View Profile URL
            </div>
            <input
              type="url"
              name="authorViewProfileURL"
              value={formData.authorViewProfileURL}
              onChange={handleInputChange}
              placeholder="https://"
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
        </div>

        {/* Author Description */}
        <div className="flex flex-col gap-3">
          <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
            Author Description
          </div>
          <textarea
            name="authorDescription"
            value={formData.authorDescription}
            onChange={handleInputChange}
            placeholder="Author Description"
            rows={4}
            className="px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors resize-none"
          />
        </div>

        {/* Author Image Upload */}
        <div className="flex flex-col gap-3">
          <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
            Author Image Upload
          </div>
          <div className="relative">
            <input
              type="file"
              id="author-image"
              accept="image/*"
              onChange={(e) => {
                void handleImageUpload(e);
              }}
              className="hidden"
            />
            <label
              htmlFor="author-image"
              className="h-32 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 flex flex-col justify-center items-center gap-2 cursor-pointer hover:border-[#7f57e2] transition-colors"
            >
              {formData.authorImageURL ? (
                <img
                  src={formData.authorImageURL}
                  alt="Author"
                  className="h-full w-auto object-contain rounded-lg"
                />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-neutral-50" />
                  <span className="text-neutral-50 text-sm font-normal font-['Poppins']">
                    {uploading ? "Uploading..." : "Upload Author Image"}
                  </span>
                </>
              )}
            </label>
            {uploadError && (
              <div className="text-red-400 text-xs mt-1">{uploadError}</div>
            )}
          </div>
        </div>

        {/* Social Media Accounts Row */}
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author X Account
            </div>
            <input
              type="url"
              name="authorXAccount"
              value={formData.authorXAccount}
              onChange={handleInputChange}
              placeholder="https://..."
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author IG Account
            </div>
            <input
              type="url"
              name="authorIGAccount"
              value={formData.authorIGAccount}
              onChange={handleInputChange}
              placeholder="https://..."
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-50 text-sm font-medium font-['Poppins']">
              Author Linkedin Account
            </div>
            <input
              type="url"
              name="authorLinkedinAccount"
              value={formData.authorLinkedinAccount}
              onChange={handleInputChange}
              placeholder="https://..."
              className="h-14 px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700 text-neutral-50 text-base font-normal font-['Poppins'] placeholder-zinc-500 focus:outline-none focus:border-[#7f57e2] transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 mt-4">
          {saveError && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {saveError}
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 h-12 px-3 py-2 rounded-lg border border-neutral-50 flex justify-center items-center transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-neutral-50 text-base font-normal font-['Poppins']">
                Cancel
              </span>
            </button>
            <button
              onClick={(): void => {
                void handleSave();
              }}
              disabled={uploading || saving}
              className="flex-1 h-12 px-3 py-2 bg-linear-to-b from-[#501bd6] to-[#7f57e2] rounded-lg flex justify-center items-center transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-white text-base font-normal font-['Poppins']">
                {saving ? "Saving..." : "Save & Next"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
