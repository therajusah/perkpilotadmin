/**
 * Generic API fetch utilities
 */

/**
 * Get authentication token from sessionStorage
 */
function getAuthToken(): string | null {
  return sessionStorage.getItem("admin_auth_token");
}

/**
 * Create headers with authentication token
 */
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Generic function to fetch data from an API endpoint with timeout support
 * @param url 
 * @param timeoutMs
 * @returns Promise resolving to array of items
 */
export async function fetchApiData<T>(
  url: string,
  timeoutMs = 10000
): Promise<T[]> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });

    clearTimeout(id);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch: ${res.status} ${res.statusText} ${text}`
      );
    }

    const data = await res.json() as T[] | { value?: T[]; data?: T[] };
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === 'object' && data !== null && 'value' in data && Array.isArray(data.value)) {
      return data.value;
    }

    if (data && typeof data === 'object' && data !== null && 'data' in data && Array.isArray(data.data)) {
      return data.data;
    }

    throw new Error(
      "Invalid response shape: expected an array or { value: T[] } or { data: T[] }"
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/**
 * Authenticated fetch function for protected endpoints
 * Automatically includes Authorization header with JWT token
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Request timeout in milliseconds (default: 15000)
 */
export async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const headers = getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
  const response = await fetch(url, {
    ...options,
      signal: controller.signal,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

    clearTimeout(timeoutId);

  if (response.status === 401) {
      sessionStorage.removeItem("admin_auth_token");
      sessionStorage.removeItem("admin_user");
      sessionStorage.removeItem("admin_auth_token_exp");
    window.location.href = "/login";
    throw new Error("Authentication failed. Please login again.");
  }

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({ error: "Request failed" }));
    
    let errorMessage = "Request failed";
    if (errorData && typeof errorData === "object") {
      if ("error" in errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      } else if ("message" in errorData && typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    }
    
    throw new Error(errorMessage || `Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    
    throw error;
  }
}

/**
 * Authenticated POST request
 */
export async function authenticatedPost<T>(
  url: string,
  body: unknown
): Promise<T> {
  return authenticatedFetch<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Authenticated PUT request
 */
export async function authenticatedPut<T>(
  url: string,
  body: unknown
): Promise<T> {
  return authenticatedFetch<T>(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Authenticated PATCH request
 */
export async function authenticatedPatch<T>(
  url: string,
  body: unknown
): Promise<T> {
  return authenticatedFetch<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Authenticated DELETE request
 */
export async function authenticatedDelete<T>(
  url: string
): Promise<T> {
  return authenticatedFetch<T>(url, {
    method: "DELETE",
  });
}

