import {useMemo, useState, useEffect, useCallback, useRef, type ReactElement} from "react";
import BlogsCard from "./BlogCard";
import { ChevronDown } from "lucide-react";
import { BLOGS_API } from "../../../config/backend";
import type { BlogApiResponse, UIBlog } from "../../../types/blog.types";
import { formatDate } from "../../../utils/helpers";
import { authenticatedPatch } from "../../../utils/api";

export default function ArticleGrid(): ReactElement{
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const [blogs, setBlogs] = useState<UIBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlogIds, setSelectedBlogIds] = useState<Set<string>>(new Set());
  const [featuredBlogIds, setFeaturedBlogIds] = useState<Set<string>>(new Set());
  const selectedBlogIdsRef = useRef<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedBlogIdsRef.current = selectedBlogIds;
  }, [selectedBlogIds]);

  // Clear toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Show toast notification
  const showToast = (message: string): void => {
    setToastMessage(message);
    // Clear existing timeout
    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
    }
    // Auto-hide after 4 seconds
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  // Fetch blogs from API
  const fetchBlogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(BLOGS_API);
      if (!response.ok) {
        throw new Error(`Failed to fetch blogs: ${response.status}`);
      }
      const data = await response.json() as BlogApiResponse[] | { data: BlogApiResponse[] };
      const blogsData = Array.isArray(data) ? data : (data.data ?? []);
      
      // Transform API response to UI format
      const transformedBlogs: UIBlog[] = blogsData.map((blog): UIBlog => ({
        _id: blog._id,
        id: blog.id ?? blog._id,
        title: blog.blogHeading,
        description: blog.blogBody,
        imageUrl: blog.blogHeroImage,
        featured: blog.blogIsFeatured ?? false, // Default to false when missing, don't use blogIsPublished as fallback
        views: blog.blogViewCount ?? 0,
        tags: blog.blogCategory ? [blog.blogCategory] : [],
        readTime: blog.blogReadingTime,
        date: formatDate(blog.createdAt),
        category: blog.blogCategory,
        isSelected: false, // Will be updated based on selectedBlogIds state
      }));

      // Update featured blogs set from API
      const featured = new Set<string>();
      transformedBlogs.forEach((blog) => {
        if (blog.featured && blog.id) {
          featured.add(blog.id);
        }
      });
      setFeaturedBlogIds(featured);

      // Update isSelected based on current selectedBlogIds (from ref)
      const updatedBlogs = transformedBlogs.map((blog) => ({
        ...blog,
        isSelected: selectedBlogIdsRef.current.has(blog.id ?? ""),
      }));

      setBlogs(updatedBlogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  // Toggle blog selection
  const toggleSelection = (blogId: string): void => {
    setSelectedBlogIds((prev) => {
      const next = new Set(prev);
      if (next.has(blogId)) {
        next.delete(blogId);
      } else {
        next.add(blogId);
      }
      return next;
    });
    
    // Update blog's isSelected state
    setBlogs((prev) =>
      prev.map((blog) =>
        blog.id === blogId ? { ...blog, isSelected: !blog.isSelected } : blog
      )
    );
  };

  // Toggle featured status
  const toggleFeatured = async (blogId: string): Promise<void> => {
    const blog = blogs.find((b) => b.id === blogId);
    if (!blog) return;

    const newFeaturedStatus = !featuredBlogIds.has(blogId);
    setFeaturedBlogIds((prev) => {
      const next = new Set(prev);
      if (newFeaturedStatus) {
        next.add(blogId);
      } else {
        next.delete(blogId);
      }
      return next;
    });

    // Update local state
    setBlogs((prev) =>
      prev.map((b) =>
        b.id === blogId ? { ...b, featured: newFeaturedStatus } : b
      )
    );

    // Update on backend
    try {
      const blogIdToUpdate = blog._id ?? blog.id;
      if (!blogIdToUpdate) return;

      await authenticatedPatch(`${BLOGS_API}/${blogIdToUpdate}`, {
        blogIsFeatured: newFeaturedStatus,
      });
    } catch (error) {
      console.error("Error updating featured status:", error);
      
      // Show user-facing error notification (avoid duplicated message)
      const baseMessage = "Failed to update featured status";
      const detail =
        error instanceof Error && error.message
          ? error.message.trim()
          : "";
      const normalizedDetail = detail.toLowerCase();
      const finalMessage =
        detail && !normalizedDetail.startsWith(baseMessage.toLowerCase())
          ? `${baseMessage}: ${detail}`
          : detail || baseMessage;
      showToast(finalMessage);
      
      // Revert on error
      setFeaturedBlogIds((prev) => {
        const next = new Set(prev);
        if (newFeaturedStatus) {
          next.delete(blogId);
        } else {
          next.add(blogId);
        }
        return next;
      });
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === blogId ? { ...b, featured: !newFeaturedStatus } : b
        )
      );
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter((p): boolean => {
      const hay = `${p.title ?? ""} ${p.description ?? ""} ${(p.tags ?? []).join(" ")} ${p.category ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [blogs, query]);

  // Sort: featured blogs first, then by date (newest first)
  const sortedBlogs = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aFeatured = featuredBlogIds.has(a.id ?? "");
      const bFeatured = featuredBlogIds.has(b.id ?? "");
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      
      // Both featured or both not featured - sort by date
      const aDate = a.date ? new Date(a.date.split("/").reverse().join("-")) : new Date(0);
      const bDate = b.date ? new Date(b.date.split("/").reverse().join("-")) : new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [filtered, featuredBlogIds]);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="fixed top-4 right-4 z-50 px-4 py-3 bg-red-600 text-white rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px] animate-in slide-in-from-top-5 fade-in"
          onMouseEnter={(): void => {
            // Pause auto-hide on hover
            if (toastTimeoutRef.current !== null) {
              clearTimeout(toastTimeoutRef.current);
            }
          }}
          onMouseLeave={(): void => {
            // Resume auto-hide when mouse leaves
            toastTimeoutRef.current = window.setTimeout(() => {
              setToastMessage(null);
              toastTimeoutRef.current = null;
            }, 4000);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="flex-1 text-sm font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={(): void => {
              setToastMessage(null);
              if (toastTimeoutRef.current !== null) {
                clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
              }
            }}
            className="ml-2 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
            aria-label="Dismiss notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

    <div className="w-full p-4 bg-zinc-800 rounded-2xl flex flex-col justify-start items-start gap-6">
      <div className="self-stretch pb-4 border-b border-zinc-700 inline-flex justify-between items-center">
        <div className="text-neutral-50 text-xl font-medium leading-loose">
          Feature Blogs On Top
        </div>
        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700/20 focus:outline-none focus:ring-2 focus:ring-[#7f57e2]"
          aria-expanded={open}
          onClick={(): void => setOpen((v) => !v)}
          aria-label={open ? "Collapse article list" : "Expand article list"}
        >
          <ChevronDown
            className={`text-zinc-400 transition-transform duration-150 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>
      {open && (
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blogs"
              className="bg-transparent outline-none text-neutral-50 placeholder:text-zinc-500 w-full"
              aria-label="Search blogs"
            />
          </div>
        </div>
      )}

      {open && (
        <>
          {loading ? (
            <div className="self-stretch flex justify-center items-center py-12">
              <div className="text-zinc-400 text-base">Loading blogs...</div>
            </div>
          ) : sortedBlogs.length === 0 ? (
            <div className="self-stretch flex justify-center items-center py-12">
              <div className="text-zinc-400 text-base">
                {query ? "No blogs found matching your search." : "No blogs available."}
              </div>
            </div>
          ) : (
        <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedBlogs.map((blog): ReactElement=> (
                <div key={blog.id} className="relative">
                  {/* Selection checkbox */}
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedBlogIds.has(blog.id ?? "")}
                      onChange={(): void => toggleSelection(blog.id ?? "")}
                      className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-[#7f57e2] focus:ring-2 focus:ring-[#7f57e2] cursor-pointer"
                      aria-label={`Select ${blog.title ?? "blog"}`}
                    />
                  </div>
                  
                  {/* Featured toggle button */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      type="button"
                      onClick={(): void => {
                        void toggleFeatured(blog.id ?? "");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        featuredBlogIds.has(blog.id ?? "")
                          ? "bg-[#7f57e2] text-white hover:bg-[#6d47d1]"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                      aria-label={
                        featuredBlogIds.has(blog.id ?? "")
                          ? `Unfeature ${blog.title ?? "blog"}`
                          : `Feature ${blog.title ?? "blog"}`
                      }
                    >
                      {featuredBlogIds.has(blog.id ?? "") ? "Featured" : "Feature"}
                    </button>
                  </div>

            <BlogsCard
                    id={blog.id}
                    title={blog.title}
                    description={blog.description}
                    imageUrl={blog.imageUrl}
                    tags={blog.tags}
                    views={blog.views}
                    date={blog.date}
                    readTime={blog.readTime}
                    featured={featuredBlogIds.has(blog.id ?? "")}
                  />
                </div>
          ))}
        </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
