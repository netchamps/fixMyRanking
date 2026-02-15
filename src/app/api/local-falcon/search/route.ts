import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_FALCON_BASE_URL = "https://api.localfalcon.com";
const DEFAULT_PLATFORM = "google";
const SEARCH_TIMEOUT_MS = 45_000;
const MAX_RESULTS = 8;

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

  pushQuery(trimmedLocation);

  return queries;
}

async function postLocalFalcon<T>(
  endpoint: string,
  body: Record<string, string>,
  signal: AbortSignal,
): Promise<LocalFalconEnvelope<T>> {
  const response = await fetch(`${LOCAL_FALCON_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildFormBody(body),
    cache: "no-store",
    signal,
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
  const response = await postLocalFalcon<AccountLocationSearchData>(
    "/v2/locations/search",
    {
      api_key: apiKey,
      name: query.name,
      proximity: query.proximity ?? "",
      platform: DEFAULT_PLATFORM,
    },
    signal,
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

async function collectSearchMatches(
  apiKey: string,
  queries: LocationSearchQuery[],
  signal: AbortSignal,
  combined: Map<string, SearchResponseItem>,
) {
  for (const query of queries) {
    const results = await searchLocations(apiKey, query, signal);

    for (const result of results) {
      const mapped = mapSearchResult(result);

      if (!mapped || combined.has(mapped.placeId)) {
        continue;
      }

      combined.set(mapped.placeId, mapped);

      if (combined.size >= MAX_RESULTS) {
        return;
      }
    }

    if (combined.size > 0) {
      return;
    }
  }
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const combined = new Map<string, SearchResponseItem>();
    const primaryQueries = buildLocationSearchQueries(parsedBody.query);

    await collectSearchMatches(apiKey, primaryQueries, controller.signal, combined);

    if (combined.size === 0 && parsedBody.keyword) {
      const keywordFirstFallback = buildLocationSearchQueries(
        `${parsedBody.keyword} ${parsedBody.query}`,
      );
      await collectSearchMatches(apiKey, keywordFirstFallback, controller.signal, combined);
    }

    if (combined.size === 0 && parsedBody.keyword) {
      const queryFirstFallback = buildLocationSearchQueries(
        `${parsedBody.query} ${parsedBody.keyword}`,
      );
      await collectSearchMatches(apiKey, queryFirstFallback, controller.signal, combined);
    }

    return NextResponse.json({
      success: true,
      query: parsedBody.query,
      results: Array.from(combined.values()).slice(0, MAX_RESULTS),
    });
  } catch (error) {
    const isAbortError =
      error instanceof DOMException
        ? error.name === "AbortError"
        : error instanceof Error && error.message.toLowerCase().includes("aborted");

    const message = isAbortError
      ? "Die Standortsuche dauert laenger als erwartet. Bitte erneut versuchen."
      : error instanceof Error
        ? error.message
        : "Standorte konnten nicht geladen werden.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: error instanceof RouteError ? error.status : 500,
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
