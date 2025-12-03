import { useState, useEffect, useCallback, useMemo, type ReactElement } from "react";
import BlogsCard from "../BlogManagement/BlogCard";
import Pagination from "../../Reviews/Reviews/Pagination";
import { BLOGS_API } from "../../../config/backend";
import BlogCardPopup from "./BlogCardPopup";
import type { BlogApiResponse, UIBlog, BlogsGridProps } from "../../../types/blog.types";
import { formatDate } from "../../../utils/helpers";
import { authenticatedDelete } from "../../../utils/api";

// Helper to safely extract title string
const getTitleString = (blog: UIBlog): string => {
  if (typeof blog.title === "string") {
    return String(blog.title);
  }
  if (typeof blog.blogHeading === "string") {
    return String(blog.blogHeading);
  }
  return "";
};

// Helper to safely extract description string
const getDescriptionString = (blog: UIBlog): string => {
  if (typeof blog.description === "string") {
    return String(blog.description);
  }
  if (typeof blog.blogBody === "string") {
    return String(blog.blogBody);
  }
  return "";
};

export default function BlogsGrid({
  blogs,
  onViewDetails: _onViewDetails,
  itemsPerPage = 6,
  showPagination = true,
  sortBy = "newly-published",
}: BlogsGridProps): ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [apiBlogs, setApiBlogs] = useState<UIBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  
  // Popup states
  const [selectedBlog, setSelectedBlog] = useState<UIBlog | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Handle blog card click - show edit/delete popup
  const handleBlogClick = (blog: UIBlog): void => {
    setSelectedBlog(blog);
    setShowModal(true);
  };

  // Fetch blogs from API (reusable function)
  const fetchBlogs = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true);
    }
    setFetchError(null);
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
        featured: blog.blogIsFeatured ?? false, 
        views: blog.blogViewCount ?? 0,
        tags: blog.blogCategory ? [blog.blogCategory] : [],
        readTime: blog.blogReadingTime,
        date: formatDate(blog.createdAt),
        createdAt: blog.createdAt, // Preserve createdAt for sorting
        updatedAt: blog.updatedAt, // Preserve updatedAt as fallback for sorting
      }));
      
      setApiBlogs(transformedBlogs);
    } catch (e) {
      console.error("fetchBlogs error", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setFetchError(errorMessage);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Handle delete action
  const handleDelete = async (): Promise<void> => {
    if (!selectedBlog) return;
    
    const idToDelete = selectedBlog.id ?? selectedBlog._id;
    if (!idToDelete) {
      console.error("Cannot delete: missing blog ID");
      alert("Error: Cannot delete blog - missing ID");
      return;
    }

    try {
      await authenticatedDelete(`${BLOGS_API}/${idToDelete}`);
      
        setShowModal(false);
        setSelectedBlog(null);
        
        // Refresh the blog list from API (without showing loading spinner)
        await fetchBlogs(false);
    } catch (error) {
      console.error("Delete failed", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete blog";
      alert(`Error deleting blog: ${errorMessage}`);
    }
  };

  // Convert blog to format for BlogCardPopup
  const convertBlogForPopup = (blog: UIBlog) => {
    const id = blog.id ?? blog._id ?? "";
    return {
      _id: blog._id,
      id,
      title: getTitleString(blog),
      description: getDescriptionString(blog),
      imageUrl: blog.imageUrl,
      featured: blog.featured,
      views: blog.views,
      tags: blog.tags,
      readTime: blog.readTime,
      date: blog.date,
      editPath: id ? `/addblog/${id}` : undefined,
      deleteTitle: "Want to delete this blog card?",
      deleteSubtitle: "After deleting the blog it cannot be recovered so be careful before deleting it!",
    };
  };

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Reset to page 1 when switching between mobile/desktop or when sort changes
  useEffect((): void => {
    setCurrentPage(1);
  }, [isMobile, sortBy]);

  // Fetch blogs from API on mount (if no `blogs` prop provided)
  useEffect(() => {
    if (blogs && blogs.length) return; // caller provided blogs
    void fetchBlogs();
  }, [blogs, fetchBlogs]);

  // Decide which data source to use: prop -> API -> empty array
  const sourceBlogs = blogs && blogs.length > 0 ? blogs : apiBlogs;

  // Calculate items per page based on screen size
  const effectiveItemsPerPage = isMobile ? 3 : itemsPerPage;

  // Filter by single global search query (title, description, tags)
  const normalizedQuery = query.trim().toLowerCase();
  const filteredBlogs = normalizedQuery
    ? sourceBlogs.filter((b): boolean => {
        const title = getTitleString(b).toLowerCase();
        const description = getDescriptionString(b).toLowerCase();
        const tags = Array.isArray(b.tags)
          ? b.tags.join(" ").toLowerCase()
          : "";
        return (
          title.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          tags.includes(normalizedQuery)
        );
      })
    : sourceBlogs;

  const getDateTimestamp = (blog: UIBlog): number => {
    const date = blog.createdAt || blog.updatedAt;
    if (!date) return 0;
    try {
      return typeof date === "string" ? new Date(date).getTime() : date.getTime();
    } catch {
      return 0;
    }
  };


  const sortedBlogs = useMemo(() => {
    const blogsToSort = [...filteredBlogs];
    
    switch (sortBy) {
      case "newly-published": {
        return blogsToSort.sort((a, b) => {
          const dateA = getDateTimestamp(a);
          const dateB = getDateTimestamp(b);
          return dateB - dateA; // Newest first
        });
      }
      case "oldest": {
        return blogsToSort.sort((a, b) => {
          const dateA = getDateTimestamp(a);
          const dateB = getDateTimestamp(b);
          return dateA - dateB; // Oldest first
        });
      }
      case "views-high": {
        return blogsToSort.sort((a, b) => {
          const viewsA = typeof a.views === "number" ? a.views : (typeof a.views === "string" ? parseInt(a.views, 10) || 0 : 0);
          const viewsB = typeof b.views === "number" ? b.views : (typeof b.views === "string" ? parseInt(b.views, 10) || 0 : 0);
          return viewsB - viewsA; // High to low
        });
      }
      case "views-low": {
        return blogsToSort.sort((a, b) => {
          const viewsA = typeof a.views === "number" ? a.views : (typeof a.views === "string" ? parseInt(a.views, 10) || 0 : 0);
          const viewsB = typeof b.views === "number" ? b.views : (typeof b.views === "string" ? parseInt(b.views, 10) || 0 : 0);
          return viewsA - viewsB; // Low to high
        });
      }
      case "name-az": {
        return blogsToSort.sort((a, b) => {
          const titleA = getTitleString(a).toLowerCase();
          const titleB = getTitleString(b).toLowerCase();
          return titleA.localeCompare(titleB); // A to Z
        });
      }
      default:
        return blogsToSort;
    }
  }, [filteredBlogs, sortBy]);

  // Calculate pagination based on sorted results
  const totalPages =
    Math.ceil(sortedBlogs.length / effectiveItemsPerPage) || 1;
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const endIndex = startIndex + effectiveItemsPerPage;
  const displayBlogs = showPagination
    ? sortedBlogs.slice(startIndex, endIndex)
    : sortedBlogs;

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
    // Scroll to top of grid when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      {/* Loading State */}
      {loading && (
        <div className="col-span-full text-center py-6">Loading blogs...</div>
      )}

      {/* Error State */}
      {fetchError && (
        <div className="col-span-full text-center text-red-500 py-6">
          {fetchError}
        </div>
      )}

      {/* Empty State */}
      {!loading && !fetchError && displayBlogs.length === 0 && (
        <div className="col-span-full text-center py-6 text-gray-500">
          No blogs available at the moment.
        </div>
      )}

      {/* Search bar */}
      <div className="box-border flex flex-col justify-center items-start p-0 gap-2.5 w-full max-w-[1068px] px-4 sm:px-0 h-12 bg-[#27272A] border border-[#3F3F46] rounded-xl relative">
        <div className="absolute flex flex-row items-center p-0 gap-3 w-[139px] h-6 left-4 top-3 z-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            className="w-[22px] h-[22px]"
          >
            <path
              d="M10.5404 19.2499C15.3498 19.2499 19.2487 15.3511 19.2487 10.5416C19.2487 5.73211 15.3498 1.83325 10.5404 1.83325C5.73088 1.83325 1.83203 5.73211 1.83203 10.5416C1.83203 15.3511 5.73088 19.2499 10.5404 19.2499Z"
              stroke="#727A8F"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.1654 20.1666L18.332 18.3333"
              stroke="#727A8F"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            value={query}
            onChange={(e): void => setQuery(e.target.value)}
            placeholder="Search Blogs"
            className="bg-transparent outline-none text-[#A1A1AA] placeholder:text-[#A1A1AA] text-base font-normal font-['Poppins'] leading-6 w-[105px] h-6"
            aria-label="Search blogs"
          />
        </div>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-[1068px] px-4 mt-6">
        {displayBlogs.map((blog, idx): ReactElement => {
          const idKey =
            blog.id ??
            blog._id ??
            `blog-${idx}`;

          return (
            <div key={String(idKey)} className="flex flex-col items-center p-0 w-full min-h-[627px] mt-5">
              {/* Customize Blog Card Label - informational only */}
              <div
                data-layer="Frame 2147223651"
                className="Frame2147223651 w-[250px] p-2.5 bg-[#2f2f32] rounded-tl-lg rounded-tr-lg inline-flex justify-center items-center gap-2.5"
              >
                <div
                  data-layer="Customize Blog Card?"
                  className="CustomizeBlogCard justify-start text-neutral-50 text-sm font-medium font-['Plus_Jakarta_Sans'] underline leading-[21px]"
                >
                  Customize Blog Card?
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942"
                    stroke="#FAFAFA"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <BlogsCard
                id={String(idKey)}
                title={getTitleString(blog) || undefined}
                description={getDescriptionString(blog) || undefined}
                imageUrl={blog.imageUrl || undefined}
                featured={blog.featured ?? false}
                views={typeof blog.views === "number" ? blog.views : (typeof blog.views === "string" ? blog.views : 0)}
                tags={Array.isArray(blog.tags) ? blog.tags : []}
                readTime={blog.readTime || undefined}
                date={blog.date || undefined}
                onClick={(): void => handleBlogClick(blog)}
              />
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Edit/Delete Popup */}
      {showModal && selectedBlog && (
        <BlogCardPopup
          onClose={(): void => {
            setShowModal(false);
            setSelectedBlog(null);
          }}
          onDelete={handleDelete}
          blog={convertBlogForPopup(selectedBlog)}
        />
      )}
    </div>
  );
}

