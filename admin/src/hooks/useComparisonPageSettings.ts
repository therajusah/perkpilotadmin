import { COMPARISON_PAGE_SETTINGS_API } from "../config/backend";
import type { ComparisonPageSettingsApiResponse } from "../types/api.types";
import { authenticatedPut } from "../utils/api";

const DEFAULT_TIMEOUT = 10000;

async function requestWithTimeout<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fetchComparisonPageSettings(
  timeoutMs = DEFAULT_TIMEOUT
): Promise<ComparisonPageSettingsApiResponse> {
  return requestWithTimeout<ComparisonPageSettingsApiResponse>(
    COMPARISON_PAGE_SETTINGS_API,
    {},
    timeoutMs
  ).catch((error) => {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch comparison page settings: ${error.message}`);
    }
    throw error;
  });
}

export function updateComparisonPageSettings(
  body: Partial<ComparisonPageSettingsApiResponse>,
  _timeoutMs = DEFAULT_TIMEOUT
): Promise<ComparisonPageSettingsApiResponse> {
  return authenticatedPut<ComparisonPageSettingsApiResponse>(
    COMPARISON_PAGE_SETTINGS_API,
    body ?? {}
  ).catch((error) => {
    if (error instanceof Error) {
      throw new Error(`Failed to update comparison page settings: ${error.message}`);
    }
    throw error;
  });
}



