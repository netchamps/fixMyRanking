import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_FALCON_BASE_URL = "https://api.localfalcon.com";
const DEFAULT_PLATFORM = "google";
const SEARCH_TIMEOUT_MS = Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_TIMEOUT_MS))
  ? Math.max(10_000, Number(process.env.LOCAL_FALCON_SEARCH_TIMEOUT_MS))
  : 60_000;
const SEARCH_QUERY_TIMEOUT_MS = Number.isFinite(
  Number(process.env.LOCAL_FALCON_SEARCH_QUERY_TIMEOUT_MS),
)
  ? Math.max(3_000, Number(process.env.LOCAL_FALCON_SEARCH_QUERY_TIMEOUT_MS))
  : 12_000;
const SEARCH_BATCH_CONCURRENCY = 2;
const MAX_RESULTS = Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_MAX_RESULTS))
  ? Math.min(100, Math.max(8, Number(process.env.LOCAL_FALCON_SEARCH_MAX_RESULTS)))
  : 32;
const SEARCH_TARGET_RESULTS = Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_TARGET_RESULTS))
  ? Math.min(MAX_RESULTS, Math.max(8, Number(process.env.LOCAL_FALCON_SEARCH_TARGET_RESULTS)))
  : 16;
const SEARCH_SOFT_TIMEOUT_MS = Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_SOFT_TIMEOUT_MS))
  ? Math.max(8_000, Number(process.env.LOCAL_FALCON_SEARCH_SOFT_TIMEOUT_MS))
  : 20_000;
const ENABLE_LOCAL_FALCON_DEBUG =
  process.env.LOCAL_FALCON_DEBUG_LOGS === "true" ||
  process.env.LOCAL_FALCON_DEBUG_LOGS === "1" ||
  process.env.NODE_ENV !== "production";

type LocalFalconEnvelope<T> = {
  code: number;
  code_desc: string | false;
  success: boolean;
  message: string | false;
  data: T;
};

type SearchPayload = {
  query: string;
  keyword?: string;
};

type AccountLocationSearchResult = {
  place_id?: string;
  name?: string;
  address?: string;
  lat?: string | number;
  lng?: string | number;
  rating?: string | number;
  reviews?: string | number;
  phone?: string | number;
  url?: string;
};

type AccountLocationSearchData = {
  count?: number;
  true_count?: number;
  results?: AccountLocationSearchResult[];
};

type SearchResponseItem = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviews: number | null;
  phone: string | null;
  website: string | null;
};

type LocationSearchQuery = {
  name: string;
  proximity?: string;
};

class RouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parsePayload(payload: unknown): SearchPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  const keyword = typeof payload.keyword === "string" ? payload.keyword.trim() : "";

  if (!query) {
    return null;
  }

  return { query, keyword: keyword || undefined };
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return error instanceof Error && error.message.toLowerCase().includes("aborted");
}

function isFatalSearchError(error: unknown): boolean {
  return error instanceof RouteError && (error.status === 401 || error.status === 403);
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "***";
  }

  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

function sanitizeLogBody(body: Record<string, string>) {
  if (!("api_key" in body)) {
    return body;
  }

  return {
    ...body,
    api_key: maskApiKey(body.api_key),
  };
}

function debugLog(message: string, payload: unknown) {
  if (!ENABLE_LOCAL_FALCON_DEBUG) {
    return;
  }

  console.log(`[local-falcon/search] ${message}`, payload);
}

function buildFormBody(entries: Record<string, string>): URLSearchParams {
  const form = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    if (value.length > 0) {
      form.set(key, value);
    }
  }

  return form;
}

function buildLocationSearchQueries(location: string): LocationSearchQuery[] {
  const trimmedLocation = location.trim();
  const queries: LocationSearchQuery[] = [];
  const dedupe = new Set<string>();

  const pushQuery = (name: string, proximity?: string) => {
    const trimmedName = name.trim();
    const trimmedProximity = proximity?.trim() ?? "";

    if (!trimmedName) {
      return;
    }

    const dedupeKey = `${normalizeText(trimmedName)}|${normalizeText(trimmedProximity)}`;

    if (dedupe.has(dedupeKey)) {
      return;
    }

    dedupe.add(dedupeKey);
    queries.push({
      name: trimmedName,
      proximity: trimmedProximity || undefined,
    });
  };

  // Fast path first: full user query before heuristic splits.
  pushQuery(trimmedLocation);

  if (trimmedLocation.includes(",")) {
    const [name, ...rest] = trimmedLocation
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);
    const proximity = rest.join(", ").trim();

    if (name && proximity) {
      pushQuery(name, proximity);
    }
  }

  if (/\sin\s/i.test(trimmedLocation)) {
    const [name, proximity] = trimmedLocation
      .split(/\sin\s/i)
      .map((segment) => segment.trim());
    if (name && proximity) {
      pushQuery(name, proximity);
    }
  }

  const words = trimmedLocation.split(/\s+/).filter(Boolean);

  if (words.length >= 3) {
    pushQuery(words.slice(0, -2).join(" "), words.slice(-2).join(" "));
  }

  if (words.length >= 2) {
    pushQuery(words.slice(0, -1).join(" "), words[words.length - 1]);
  }

  return queries;
}

function buildSearchQueryGroups(payload: SearchPayload): LocationSearchQuery[][] {
  if (!payload.keyword) {
    return [buildLocationSearchQueries(payload.query)];
  }

  return [
    buildLocationSearchQueries(`${payload.keyword} ${payload.query}`),
    buildLocationSearchQueries(`${payload.query} ${payload.keyword}`),
    buildLocationSearchQueries(`${payload.keyword} in ${payload.query}`),
    buildLocationSearchQueries(payload.query),
  ];
}

async function postLocalFalcon<T>(
  endpoint: string,
  body: Record<string, string>,
  signal: AbortSignal,
): Promise<LocalFalconEnvelope<T>> {
  const startedAt = Date.now();
  debugLog("upstream request", {
    endpoint,
    body: sanitizeLogBody(body),
  });

  const response = await fetch(`${LOCAL_FALCON_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildFormBody(body),
    cache: "no-store",
    signal,
  });

  debugLog("upstream response", {
    endpoint,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });

  const parsed = (await response.json().catch(() => null)) as LocalFalconEnvelope<T> | null;

  if (!parsed) {
    throw new RouteError("Local Falcon request failed.", 502);
  }

  if (!response.ok || !parsed.success) {
    const message =
      typeof parsed.message === "string" && parsed.message.trim().length > 0
        ? parsed.message
        : "Local Falcon request failed.";

    const upstreamStatus =
      !response.ok
        ? response.status
        : typeof parsed.code === "number" && parsed.code >= 400 && parsed.code <= 599
          ? parsed.code
          : 502;

    throw new RouteError(message, upstreamStatus);
  }

  return parsed;
}

async function searchLocations(
  apiKey: string,
  query: LocationSearchQuery,
  signal: AbortSignal,
): Promise<AccountLocationSearchResult[]> {
  const querySignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(SEARCH_QUERY_TIMEOUT_MS),
  ]);

  const response = await postLocalFalcon<AccountLocationSearchData>(
    "/v2/locations/search",
    {
      api_key: apiKey,
      name: query.name,
      proximity: query.proximity ?? "",
      platform: DEFAULT_PLATFORM,
    },
    querySignal,
  );

  return Array.isArray(response.data?.results) ? response.data.results : [];
}

function mapSearchResult(result: AccountLocationSearchResult): SearchResponseItem | null {
  const placeId = result.place_id?.trim() ?? "";
  const name = result.name?.trim() ?? "";
  const lat = toNumber(result.lat);
  const lng = toNumber(result.lng);

  if (!placeId || !name || lat === null || lng === null) {
    return null;
  }

  return {
    placeId,
    name,
    address: result.address?.trim() ?? "-",
    lat,
    lng,
    rating: toNumber(result.rating),
    reviews: toNumber(result.reviews),
    phone: result.phone?.toString() ?? null,
    website: result.url?.toString() ?? null,
  };
}

type SearchCollectResult = {
  hadSuccessfulQuery: boolean;
  recoverableError: unknown | null;
};

async function collectSearchMatches(
  apiKey: string,
  queries: LocationSearchQuery[],
  signal: AbortSignal,
  combined: Map<string, SearchResponseItem>,
  stopWhenSizeAtLeast: number,
): Promise<SearchCollectResult> {
  let hadSuccessfulQuery = false;
  let lastRecoverableError: unknown = null;

  for (let index = 0; index < queries.length; index += SEARCH_BATCH_CONCURRENCY) {
    const batch = queries.slice(index, index + SEARCH_BATCH_CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (query) => {
        try {
          const results = await searchLocations(apiKey, query, signal);
          return { results };
        } catch (error) {
          return { error };
        }
      }),
    );

    for (const entry of settled) {
      if ("error" in entry) {
        if (signal.aborted && isAbortError(entry.error)) {
          throw entry.error;
        }

        if (isFatalSearchError(entry.error)) {
          throw entry.error;
        }

        lastRecoverableError = entry.error;
        continue;
      }

      hadSuccessfulQuery = true;

      for (const result of entry.results) {
        const mapped = mapSearchResult(result);

        if (!mapped || combined.has(mapped.placeId)) {
          continue;
        }

        combined.set(mapped.placeId, mapped);

        if (combined.size >= MAX_RESULTS || combined.size >= stopWhenSizeAtLeast) {
          return {
            hadSuccessfulQuery,
            recoverableError: lastRecoverableError,
          };
        }
    }

    if (combined.size >= MAX_RESULTS || combined.size >= stopWhenSizeAtLeast) {
      return {
        hadSuccessfulQuery,
        recoverableError: lastRecoverableError,
      };
    }
  }

  }

  return {
    hadSuccessfulQuery,
    recoverableError: lastRecoverableError,
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.LOCAL_FALCON_API;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "LOCAL_FALCON_API is missing in environment variables.",
      },
      { status: 500 },
    );
  }

  const parsedBody = parsePayload(await request.json().catch(() => null));

  if (!parsedBody) {
    return NextResponse.json(
      {
        success: false,
        message: "Bitte Suchbegriff angeben.",
      },
      { status: 400 },
    );
  }

  debugLog("incoming request", {
    query: parsedBody.query,
    keyword: parsedBody.keyword ?? null,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const combined = new Map<string, SearchResponseItem>();
    let hadAnySuccessfulQuery = false;
    let lastRecoverableError: unknown = null;
    const queryGroups = buildSearchQueryGroups(parsedBody);
    const searchStartedAt = Date.now();
    let softTimeoutTriggered = false;

    for (const queries of queryGroups) {
      if (combined.size >= MAX_RESULTS || combined.size >= SEARCH_TARGET_RESULTS) {
        break;
      }

      if (combined.size > 0 && Date.now() - searchStartedAt >= SEARCH_SOFT_TIMEOUT_MS) {
        softTimeoutTriggered = true;
        break;
      }

      const collectResult = await collectSearchMatches(
        apiKey,
        queries,
        controller.signal,
        combined,
        SEARCH_TARGET_RESULTS,
      );

      hadAnySuccessfulQuery ||= collectResult.hadSuccessfulQuery;
      if (collectResult.recoverableError) {
        lastRecoverableError = collectResult.recoverableError;
      }
    }

    if (combined.size === 0 && !hadAnySuccessfulQuery && lastRecoverableError) {
      throw lastRecoverableError;
    }

    debugLog("response ready", {
      query: parsedBody.query,
      keyword: parsedBody.keyword ?? null,
      resultsCount: combined.size,
      hadAnySuccessfulQuery,
      elapsedMs: Date.now() - searchStartedAt,
      targetResults: SEARCH_TARGET_RESULTS,
      softTimeoutTriggered,
    });

    return NextResponse.json({
      success: true,
      query: parsedBody.query,
      results: Array.from(combined.values()).slice(0, MAX_RESULTS),
    });
  } catch (error) {
    const isRequestAborted = isAbortError(error);

    const message = isRequestAborted
      ? "Die Standortsuche dauert laenger als erwartet. Bitte erneut versuchen."
      : error instanceof Error
        ? error.message
        : "Standorte konnten nicht geladen werden.";
    const status = isRequestAborted
      ? 504
      : error instanceof RouteError
        ? error.status
        : 500;

    debugLog("response error", {
      query: parsedBody.query,
      keyword: parsedBody.keyword ?? null,
      status,
      message,
    });

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status,
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
