import {useEffect, useRef, useState, type ReactElement} from "react";
import { uploadToCloudinary } from "../../config/cloudinary";

type Props = {
  imageUrl?: string;
  onImageChange?: (url: string | null) => void;
};

export default function HeroImageUpload({ imageUrl, onImageChange }: Props): ReactElement {
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);


  useEffect(() => {
    if (imageUrl !== undefined) {
      setPreviewUrl(imageUrl || null);
    }
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
        imgRef.current = null;
      }
    };
  }, [previewUrl]);

  async function handleFileInput(f: File | null): Promise<void> {
    if (!f) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setFile(null);
      setProgress(null);
      setImageError(false);
      if (onImageChange) onImageChange(null);
      return;
    }

    setFile(f);
    setProgress(0);
    setImageError(false);

    // Create local preview for immediate feedback
    const localPreviewUrl = URL.createObjectURL(f);
    setPreviewUrl(localPreviewUrl);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p === null) return 1;
        const next = Math.min(95, p + Math.floor(Math.random() * 10) + 5);
        return next;
      });
    }, 300);

    try {
      const cloudinaryUrl = await uploadToCloudinary(f);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl(cloudinaryUrl);
      setProgress(100);
      setTimeout(() => {
        setProgress(null);
      }, 600);

      if (onImageChange) onImageChange(cloudinaryUrl);
      imgRef.current = null;
    } catch (error) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setProgress(null);
      setPreviewUrl(null);
      setFile(null);
      setImageError(true);
      imgRef.current = null;
      if (onImageChange) onImageChange(null);
      console.error("Error uploading image:", error);
    }
  }

  return (
    <div
      data-layer="Row"
      className="Row self-stretch w-full py-4 bg-zinc-800 rounded-3xl outline-1 outline-zinc-700 inline-flex justify-start items-center overflow-hidden"
    >
      <div
        data-layer="Column"
        className="Column h-[226px] px-4 py-3 rounded-xl inline-flex flex-col justify-center items-start gap-3"
      >
        <div
          data-layer="Frame 2147205991"
          className="Frame2147205991 inline-flex justify-start items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 4.875C12.6213 4.875 13.125 4.37132 13.125 3.75C13.125 3.12868 12.6213 2.625 12 2.625C11.3787 2.625 10.875 3.12868 10.875 3.75C10.875 4.37132 11.3787 4.875 12 4.875Z"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 13.125C12.6213 13.125 13.125 12.6213 13.125 12C13.125 11.3787 12.6213 10.875 12 10.875C11.3787 10.875 10.875 11.3787 10.875 12C10.875 12.6213 11.3787 13.125 12 13.125Z"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 21.375C12.6213 21.375 13.125 20.8713 13.125 20.25C13.125 19.6287 12.6213 19.125 12 19.125C11.3787 19.125 10.875 19.6287 10.875 20.25C10.875 20.8713 11.3787 21.375 12 21.375Z"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 4.875C12.6213 4.875 13.125 4.37132 13.125 3.75C13.125 3.12868 12.6213 2.625 12 2.625C11.3787 2.625 10.875 3.12868 10.875 3.75C10.875 4.37132 11.3787 4.875 12 4.875Z"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 13.125C12.6213 13.125 13.125 12.6213 13.125 12C13.125 11.3787 12.6213 10.875 12 10.875C11.3787 10.875 10.875 11.3787 10.875 12C10.875 12.6213 11.3787 13.125 12 13.125Z"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 21.375C12.6213 21.375 13.125 20.8713 13.125 20.25C13.125 19.6287 12.6213 19.125 12 19.125C11.3787 19.125 10.875 19.6287 10.875 20.25C10.875 20.8713 11.3787 21.375 12 21.375Z"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div
        data-layer="Frame 2147223627"
        className="Frame2147223627 flex-1 inline-flex flex-col justify-start items-start gap-2"
      >
        <div
          data-layer="Frame 2147205559"
          className="Frame2147205559 self-stretch pb-4 flex flex-col justify-center items-start gap-3"
        >
          <div
            data-layer="Icon"
            className="Icon justify-start text-neutral-50 text-sm font-medium font-['Poppins']"
          >
            Icon
          </div>
          <div
            data-layer="Uploaded"
            data-property-1="Default"
            className="Uploaded self-stretch h-14 flex flex-col justify-start items-center gap-2"
          >
            <div
              data-layer="Frame 1321315243"
              className="Frame1321315243 self-stretch flex-1 bg-zinc-800 rounded-xl flex flex-col justify-center items-start gap-6"
            >
              <label className="sr-only" htmlFor="hero-image-input">
                Upload icon
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={(): void =>
                  document.getElementById("hero-image-input")?.click()
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById("hero-image-input")?.click();
                  }
                }}
                className="Frame1321315108 self-stretch flex-1 px-4 py-2.5 rounded-xl outline-1 -outline-offset-1 outline-zinc-700 inline-flex justify-center items-center gap-3 cursor-pointer"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="upload preview"
                    className="w-5 h-5 object-cover rounded"
                  />
                ) : (
                  <div className="ElUpload w-5 h-5 relative overflow-hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M10 20C4.47717 20 0 15.5228 0 10C0 4.47717 4.47717 0 10 0C15.5228 0 20 4.47717 20 10C20 15.5228 15.5228 20 10 20ZM10 2.17392C5.67718 2.17392 2.17392 5.67827 2.17392 10C2.17392 14.3218 5.67718 17.8261 10 17.8261C14.3228 17.8261 17.8261 14.3218 17.8261 10C17.8261 5.67827 14.3228 2.17392 10 2.17392ZM11.9565 14.1848H8.04347V9.73913H5.59783L10 5.59783L14.4022 9.73913H11.9565V14.1848Z"
                        fill="#FAFAFA"
                      />
                    </svg>
                  </div>
                )}
                <div
                  data-layer="Upload Logo"
                  className="UploadLogo text-center justify-start text-neutral-50 text-xs font-medium font-['Poppins']"
                >
                  {previewUrl ? "Change" : "Upload"}
                </div>
                <input
                  id="hero-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    void handleFileInput(f);
                  }}
                />
              </div>
            </div>
          </div>
          <div
            data-layer="Uploaded"
            data-property-1="Variant2"
            className="Uploaded self-stretch flex flex-col justify-start items-center gap-2"
          >
            <div
              data-layer="Frame 1321315109"
              className="Frame1321315109 self-stretch inline-flex justify-between items-start flex-wrap content-start"
            >
              <div
                data-layer="Frame 1321315114"
                className="Frame1321315114 flex justify-start items-center gap-3"
              >
                <div
                  data-layer="image icon"
                  className="ImageIcon p-2 bg-linear-to-b from-[#501bd6] to-[#7f57e2] rounded-[100px] inline-flex flex-col justify-center items-center gap-2 overflow-hidden"
                >
                  <div
                    data-layer="Vector"
                    className="Vector w-[19.12px] h-[16.12px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="17"
                      viewBox="0 0 20 17"
                      fill="none"
                    >
                      <path
                        d="M17.8125 0H1.3125C0.964403 0 0.630564 0.138281 0.384422 0.384422C0.138281 0.630564 0 0.964403 0 1.3125V14.8125C0 15.1606 0.138281 15.4944 0.384422 15.7406C0.630564 15.9867 0.964403 16.125 1.3125 16.125H17.8125C18.1606 16.125 18.4944 15.9867 18.7406 15.7406C18.9867 15.4944 19.125 15.1606 19.125 14.8125V1.3125C19.125 0.964403 18.9867 0.630564 18.7406 0.384422C18.4944 0.138281 18.1606 0 17.8125 0ZM1.3125 1.125H17.8125C17.8622 1.125 17.9099 1.14475 17.9451 1.17992C17.9802 1.21508 18 1.26277 18 1.3125V11.3972L15.2372 8.63438C15.1153 8.51248 14.9706 8.41579 14.8114 8.34983C14.6521 8.28386 14.4814 8.24991 14.3091 8.24991C14.1367 8.24991 13.966 8.28386 13.8068 8.34983C13.6475 8.41579 13.5028 8.51248 13.3809 8.63438L11.3728 10.6425L7.11563 6.38437C6.99375 6.26248 6.84905 6.16579 6.6898 6.09983C6.53055 6.03386 6.35987 5.99991 6.1875 5.99991C6.01513 5.99991 5.84445 6.03386 5.6852 6.09983C5.52595 6.16579 5.38125 6.26248 5.25937 6.38437L1.125 10.5187V1.3125C1.125 1.26277 1.14475 1.21508 1.17992 1.17992C1.21508 1.14475 1.26277 1.125 1.3125 1.125ZM1.125 14.8125V12.1097L6.05438 7.18031C6.07181 7.16274 6.09254 7.14879 6.11539 7.13927C6.13824 7.12975 6.16275 7.12485 6.1875 7.12485C6.21225 7.12485 6.23676 7.12975 6.25961 7.13927C6.28246 7.14879 6.30319 7.16274 6.32062 7.18031L14.1403 15H1.3125C1.26277 15 1.21508 14.9802 1.17992 14.9451C1.14475 14.9099 1.125 14.8622 1.125 14.8125ZM17.8125 15H15.7313L12.1688 11.4375L14.1759 9.42937C14.1934 9.41194 14.214 9.39811 14.2368 9.38868C14.2596 9.37924 14.284 9.37438 14.3086 9.37438C14.3332 9.37438 14.3576 9.37924 14.3804 9.38868C14.4032 9.39811 14.4238 9.41194 14.4412 9.42937L18.0037 12.9919V14.8125C18.0038 14.8374 17.9988 14.8621 17.9891 14.8851C17.9795 14.9081 17.9653 14.929 17.9475 14.9464C17.9297 14.9639 17.9086 14.9776 17.8854 14.9868C17.8622 14.996 17.8374 15.0005 17.8125 15ZM11.25 5.4375C11.25 5.25208 11.305 5.07082 11.408 4.91665C11.511 4.76248 11.6574 4.64232 11.8287 4.57136C12 4.50041 12.1885 4.48184 12.3704 4.51801C12.5523 4.55419 12.7193 4.64348 12.8504 4.77459C12.9815 4.9057 13.0708 5.07275 13.107 5.2546C13.1432 5.43646 13.1246 5.62496 13.0536 5.79627C12.9827 5.96757 12.8625 6.11399 12.7083 6.217C12.5542 6.32002 12.3729 6.375 12.1875 6.375C11.9389 6.375 11.7004 6.27623 11.5246 6.10041C11.3488 5.9246 11.25 5.68614 11.25 5.4375Z"
                        fill="#FAFAFA"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  data-layer="Frame 1321315110"
                  className="Frame1321315110 inline-flex flex-col justify-start items-start gap-1"
                >
                  <div
                    data-layer="upl2345678.jpeg"
                    className="Upl2345678Jpeg justify-start text-neutral-50 text-sm font-medium font-['Inter'] leading-[21px]"
                  >
                    {file ? file.name : "No file"}
                  </div>
                  <div
                    data-layer="4.3 MB"
                    className="3Mb justify-start text-zinc-400 text-xs font-medium font-['Inter'] leading-[18px]"
                  >
                    {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "-"}
                  </div>
                </div>
              </div>
              <div
                data-layer="basil:cross-solid"
                className="BasilCrossSolid w-6 h-6 relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                >
                  <path
                    d="M8.36971 1.29971C8.44137 1.23056 8.49855 1.14783 8.5379 1.05634C8.57725 0.964857 8.59798 0.866452 8.59889 0.766868C8.5998 0.667285 8.58088 0.568516 8.54321 0.476327C8.50554 0.384137 8.44989 0.300372 8.37951 0.22992C8.30912 0.159467 8.22541 0.103738 8.13325 0.0659841C8.0411 0.02823 7.94235 0.00920731 7.84276 0.0100254C7.74318 0.0108435 7.64476 0.0314862 7.55323 0.0707492C7.46171 0.110012 7.37893 0.167109 7.30971 0.238708L4.30371 3.24371L1.29871 0.238708C1.23005 0.165022 1.14725 0.105919 1.05525 0.0649275C0.963247 0.0239355 0.863934 0.0018935 0.763231 0.00011672C0.662528 -0.00166006 0.562499 0.0168648 0.469111 0.0545858C0.375723 0.0923068 0.290889 0.148451 0.21967 0.21967C0.148451 0.290889 0.0923068 0.375722 0.0545858 0.46911C0.0168648 0.562499 -0.00166006 0.662528 0.00011672 0.763231C0.0018935 0.863934 0.0239355 0.963247 0.0649275 1.05525C0.105919 1.14725 0.165022 1.23005 0.238708 1.29871L3.24171 4.30471L0.236709 7.30971C0.104229 7.45188 0.0321051 7.63993 0.0355333 7.83423C0.0389615 8.02853 0.117674 8.21392 0.255087 8.35133C0.3925 8.48874 0.577885 8.56745 0.772186 8.57088C0.966487 8.57431 1.15453 8.50219 1.29671 8.36971L4.30371 5.36471L7.30871 8.37071C7.45088 8.50319 7.63893 8.57531 7.83323 8.57188C8.02753 8.56846 8.21292 8.48974 8.35033 8.35233C8.48774 8.21492 8.56645 8.02953 8.56988 7.83523C8.57331 7.64093 8.50119 7.45288 8.36871 7.31071L5.36571 4.30471L8.36971 1.29971Z"
                    fill="#FAFAFA"
                  />
                </svg>
              </div>
            </div>
            <div className="Frame1171275912 self-stretch h-[26px] p-1 inline-flex justify-start items-center gap-1">
              <div className="Frame1171275749 flex-1 inline-flex flex-col justify-start items-start gap-1">
                <div className="w-full bg-neutral-50 rounded h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 bg-linear-to-b from-[#501bd6] to-[#7f57e2] transition-all"
                    style={{
                      width:
                        progress != null
                          ? `${progress}%`
                          : previewUrl
                          ? `100%`
                          : `0%`,
                    }}
                  />
                </div>
              </div>
              <div className="justify-start text-zinc-400 text-xs font-medium font-['Inter'] leading-[18px]">
                {progress != null ? `${progress}%` : previewUrl ? `100%` : `0%`}
              </div>
            </div>
            {imageError && (
              <div className="self-stretch px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-xs font-medium">
                  Failed to load image. Please try another file.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

