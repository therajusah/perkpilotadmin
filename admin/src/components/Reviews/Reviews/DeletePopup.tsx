import { useState, type ReactElement } from "react";
import ReviewsCard from "./ReviewsCard";
import { REVIEWS_API } from "../../../config/backend";
import type { ReviewApiResponse } from "../../../types/api.types";
import { authenticatedDelete } from "../../../utils/api";

export default function DeletePopup({
  onClose,
  onConfirm,
  review,
}: {
  onClose?: () => void;
  onConfirm?: () => void;
  review?: ReviewApiResponse;
}): ReactElement{
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewId = String(review?.id ?? review?._id ?? "");

  const handleConfirm = async (): Promise<void> => {
    setError(null);
    if (!reviewId) {
      setError("Missing review id");
      return;
    }

    try {
      setLoading(true);
      await authenticatedDelete(`${REVIEWS_API}/${reviewId}`);

      // success
      onConfirm?.();
      onClose?.();
    } catch (err) {
      console.error("Delete failed", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete review";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(): void => onClose?.()}
        aria-hidden
      />
      <div
        data-layer="Card Popup"
        className="relative w-[380px] p-3 bg-zinc-800 rounded-xl outline-1 -outline-offset-1 outline-zinc-700 inline-flex flex-col justify-center items-center gap-3 z-10"
      >
        <div
          data-layer="Frame 1321315042"
          className="Frame1321315042 self-stretch inline-flex justify-center items-start gap-6"
        >
          <div
            data-layer="Frame 1321315041"
            className="Frame1321315041 flex-1 flex justify-between items-center"
          >
            <div
              data-layer="Frame 2147205563"
              className="Frame2147205563 flex-1 inline-flex flex-col justify-start items-start gap-3"
            >
              <div
                data-layer="Want to delete this deal card?"
                className="WantToDeleteThisDealCard self-stretch text-center justify-center text-neutral-50 text-lg font-semibold font-['Plus_Jakarta_Sans'] capitalize leading-6"
              >
                Want to delete this deal card?
              </div>
              <div
                data-layer="After deleting the stack it can be recover so be careful before deleting it!"
                className="AfterDeletingTheStackItCanBeRecoverSoBeCarefulBeforeDeletingIt self-stretch text-center justify-center text-zinc-300 text-sm font-normal font-['Poppins'] leading-5"
              >
                After deleting the stack it can be recover so be careful before
                deleting it!
              </div>
            </div>
          </div>
        </div>
        <div className="self-stretch flex justify-center">
          <div className="w-[420px] pointer-events-none select-none">
            <ReviewsCard
              id={reviewId || "preview"}
              review={review}
              showCustomizeHeader={false}
            />
          </div>
        </div>
        <div
          data-layer="Frame 1321315044"
          className="Frame1321315044 self-stretch flex flex-col justify-start items-center gap-6"
        >
          <div
            data-layer="Frame 1321315038"
            className="Frame1321315038 self-stretch flex flex-col justify-start items-start gap-4"
          >
            <div
              data-layer="Container"
              className="Container self-stretch p-2 bg-zinc-700 rounded-xl inline-flex justify-start items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M2.72495 21C2.54162 21 2.37495 20.9543 2.22495 20.863C2.07495 20.7717 1.95829 20.6507 1.87495 20.5C1.79162 20.3493 1.74595 20.1867 1.73795 20.012C1.72995 19.8373 1.77562 19.6667 1.87495 19.5L11.125 3.5C11.225 3.33333 11.3543 3.20833 11.513 3.125C11.6716 3.04167 11.834 3 12 3C12.166 3 12.3286 3.04167 12.488 3.125C12.6473 3.20833 12.7763 3.33333 12.875 3.5L22.125 19.5C22.225 19.6667 22.271 19.8377 22.263 20.013C22.255 20.1883 22.209 20.3507 22.125 20.5C22.041 20.6493 21.9243 20.7703 21.775 20.863C21.6256 20.9557 21.459 21.0013 21.275 21H2.72495ZM12 18C12.2833 18 12.521 17.904 12.713 17.712C12.905 17.52 13.0006 17.2827 13 17C12.9993 16.7173 12.9033 16.48 12.712 16.288C12.5206 16.096 12.2833 16 12 16C11.7166 16 11.4793 16.096 11.288 16.288C11.0966 16.48 11.0006 16.7173 11 17C10.9993 17.2827 11.0953 17.5203 11.288 17.713C11.4806 17.9057 11.718 18.0013 12 18ZM12 15C12.2833 15 12.521 14.904 12.713 14.712C12.905 14.52 13.0006 14.2827 13 14V11C13 10.7167 12.904 10.4793 12.712 10.288C12.52 10.0967 12.2826 10.0007 12 10C11.7173 9.99933 11.48 10.0953 11.288 10.288C11.096 10.4807 11 10.718 11 11V14C11 14.2833 11.096 14.521 11.288 14.713C11.48 14.905 11.7173 15.0007 12 15Z"
                  fill="#FF9800"
                />
              </svg>
              <div
                data-layer="Note: Can’t be undone later! and you are free to edit this deal stack instead of deleting it full."
                className="NoteCanTBeUndoneLaterAndYouAreFreeToEditThisDealStackInsteadOfDeletingItFull flex-1 justify-start text-neutral-50 text-xs font-normal font-['Poppins']"
              >
                Note: Can&apos;t be undone later! and you are free to edit this deal
                stack instead of deleting it full.
              </div>
            </div>
            {error && (
              <div className="w-full text-center text-sm text-red-400 mt-2">
                {error}
              </div>
            )}
          </div>
          <div
            data-layer="Frame 2147205573"
            className="Frame2147205573 self-stretch inline-flex justify-center items-start gap-3"
          >
            <div
              data-layer="Buttons/main"
              data-button="ghost"
              data-size="Large"
              className={`ButtonsMain flex-1 h-10 px-4 py-2 rounded-full outline-1 -outline-offset-1 outline-[#ebeef4] flex justify-center items-center gap-2 ${
                loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={(): void => {
                if (!loading) {
                  onClose?.();
                }
              }}
              role="button"
              tabIndex={0}
              aria-disabled={loading}
            >
              <div
                data-layer="Button"
                className="Button text-center justify-start text-neutral-50 text-sm font-medium font-['Inter'] leading-5"
              >
                Cancel
              </div>
            </div>
            <div
              data-layer="Buttons/main"
              data-button="on"
              data-size="Large"
              className={`ButtonsMain flex-1 px-4 py-2 bg-neutral-50 rounded-full flex justify-center items-center gap-2 ${
                loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={(): void => {
                if (!loading) {
                  void handleConfirm();
                }
              }}
              role="button"
              tabIndex={0}
              aria-disabled={loading}
            >
              <div
                data-layer="Button"
                className="Button text-center justify-start text-zinc-950 text-sm font-medium font-['Inter'] leading-5"
              >
                {loading ? "Deleting..." : "Confirm & Delete"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
