import type { PreselectedLocation } from "@/types/preselected-location";
import type { AnalysisResult } from "@/types/analysis-api";

const CACHE_PREFIX = "analysis_result_v1:";
const CACHE_TTL_MS = 15 * 60 * 1000;
const PRELOAD_PENDING_PREFIX = "analysis_preload_pending_v1:";
const PRELOAD_PENDING_TTL_MS = 10 * 60 * 1000;
const memoryAnalysisCache = new Map<string, CachedAnalysisEntry>();
const memoryPendingCache = new Map<string, number>();

type CachedAnalysisEntry = {
  storedAt: number;
  data: AnalysisResult;
};

function normalizeForCache(value: string): string {
  return value.trim().toLowerCase();
}

export function buildAnalysisCacheKey(input: {
  location: string;
  keyword: string;
  selectedLocation: PreselectedLocation | null;
  selectedReportKey?: string;
}) {
  const locationPart = normalizeForCache(input.location);
  const keywordPart = normalizeForCache(input.keyword);
  const placeIdPart = input.selectedLocation?.placeId?.trim() || "none";
  const reportKeyPart = input.selectedReportKey?.trim() || "auto";

  return `${CACHE_PREFIX}${locationPart}|${keywordPart}|${placeIdPart}|${reportKeyPart}`;
}

export function readCachedAnalysisResult(cacheKey: string): AnalysisResult | null {
  const memoryEntry = memoryAnalysisCache.get(cacheKey);

  if (memoryEntry) {
    if (Date.now() - memoryEntry.storedAt <= CACHE_TTL_MS) {
      return memoryEntry.data;
    }

    memoryAnalysisCache.delete(cacheKey);
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(cacheKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedAnalysisEntry;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.storedAt !== "number" ||
      typeof parsed.data !== "object" ||
      parsed.data === null
    ) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    if (Date.now() - parsed.storedAt > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedAnalysisResult(
  cacheKey: string,
  result: AnalysisResult,
) {
  const entry: CachedAnalysisEntry = {
    storedAt: Date.now(),
    data: result,
  };

  memoryAnalysisCache.set(cacheKey, entry);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Ignore storage errors (e.g. Safari private mode quotas).
  }
}

export function markAnalysisPreloadPending(cacheKey: string) {
  memoryPendingCache.set(cacheKey, Date.now());

  if (typeof window === "undefined") {
    return;
  }

  try {
    const pendingKey = `${PRELOAD_PENDING_PREFIX}${cacheKey}`;
    window.sessionStorage.setItem(pendingKey, Date.now().toString());
  } catch {
    // Ignore storage errors.
  }
}

export function clearAnalysisPreloadPending(cacheKey: string) {
  memoryPendingCache.delete(cacheKey);

  if (typeof window === "undefined") {
    return;
  }

  try {
    const pendingKey = `${PRELOAD_PENDING_PREFIX}${cacheKey}`;
    window.sessionStorage.removeItem(pendingKey);
  } catch {
    // Ignore storage errors.
  }
}

export function isAnalysisPreloadPending(cacheKey: string): boolean {
  const memoryTimestamp = memoryPendingCache.get(cacheKey);

  if (typeof memoryTimestamp === "number") {
    if (Date.now() - memoryTimestamp <= PRELOAD_PENDING_TTL_MS) {
      return true;
    }

    memoryPendingCache.delete(cacheKey);
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const pendingKey = `${PRELOAD_PENDING_PREFIX}${cacheKey}`;
    const raw = window.sessionStorage.getItem(pendingKey);

    if (!raw) {
      return false;
    }

    const timestamp = Number.parseInt(raw, 10);

    if (!Number.isFinite(timestamp)) {
      window.sessionStorage.removeItem(pendingKey);
      return false;
    }

    if (Date.now() - timestamp > PRELOAD_PENDING_TTL_MS) {
      window.sessionStorage.removeItem(pendingKey);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
