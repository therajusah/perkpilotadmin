// Centralized backend URL configuration.
// Uses Vite env var VITE_BACKEND_URL when available, otherwise falls back to localhost.
const rawEnv = (import.meta as unknown as { env: Record<string, string> })?.env || {};

// Ensure the backend URL is absolute. If VITE_BACKEND_URL is provided without a
// scheme (for example `perkpilot-production-58f9.up.railway.app`), browsers
// will treat the resulting fetch URL as relative and append it to the current
// origin (e.g. `https://perkpilotadmin.up.railway.app/perkpilot-production-...`).
// To avoid that, normalize the URL here by prepending `https://` when a
// scheme is missing and strip trailing slashes.
function normalizeBackendUrl(url?: string): string {
  const fallback = "http://localhost:5002";
  if (!url) return fallback;
  const trimmed = String(url).trim().replace(/\/+$/g, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // No scheme provided — assume https for production.
  return `https://${trimmed}`;
}

export const BACKEND_URL: string = normalizeBackendUrl(rawEnv.VITE_BACKEND_URL);
// Auth API endpoint
export const AUTH_API = `${BACKEND_URL}/api/auth`;
export const DEALS_API = `${BACKEND_URL}/api/deals`;
// Deal page settings API endpoint (using query parameter)
export const DEALPAGE_API = `${DEALS_API}?page=true`;
// Stats API endpoint
export const STATS_API = `${DEALS_API}/stats`;
// Comparisions API endpoint (singular `comparision` to match backend route)
export const COMPARISIONS_API = `${BACKEND_URL}/api/comparisons`;
export const COMPARISON_PAGE_SETTINGS_API = `${COMPARISIONS_API}/page/settings`;
// Reviews API endpoint
export const REVIEWS_API = `${BACKEND_URL}/api/reviews`;
// Review page settings API endpoint
export const REVIEWPAGE_API = `${REVIEWS_API}/page/settings`;
// Authors API endpoint
export const AUTHORS_API = `${BACKEND_URL}/api/authors`;
// Blogs API endpoint
export const BLOGS_API = `${BACKEND_URL}/api/blogs`;
// Blog page settings API endpoint
export const BLOGPAGE_API = `${BACKEND_URL}/api/blogs/blogpage`;
// Homepage API endpoint
export const HOMEPAGE_API = `${BACKEND_URL}/api/homepage`;

export default BACKEND_URL;
