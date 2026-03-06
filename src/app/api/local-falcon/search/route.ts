import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERPER_BASE_URL = process.env.SERPER_API_BASE?.trim() || "https://google.serper.dev";
const SERPER_DEFAULT_GL = (process.env.SERPER_GL?.trim() || "de").toLowerCase();
const SERPER_DEFAULT_HL = (process.env.SERPER_HL?.trim() || "de").toLowerCase();
const GOOGLE_PLACES_BASE_URL =
  process.env.GOOGLE_PLACES_API_BASE_URL?.trim() || "https://places.googleapis.com";
const GOOGLE_PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName.text",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
].join(",");
const SEARCH_TIMEOUT_MS = Number.isFinite(Number(process.env.SERPER_SEARCH_TIMEOUT_MS))
  ? Math.max(10_000, Number(process.env.SERPER_SEARCH_TIMEOUT_MS))
  : 60_000;
const SEARCH_QUERY_TIMEOUT_MS = Number.isFinite(
  Number(process.env.SERPER_SEARCH_QUERY_TIMEOUT_MS),
)
  ? Math.max(3_000, Number(process.env.SERPER_SEARCH_QUERY_TIMEOUT_MS))
  : 12_000;
const SEARCH_BATCH_CONCURRENCY = 2;
const MAX_RESULTS = Number.isFinite(Number(process.env.SERPER_SEARCH_MAX_RESULTS))
  ? Math.min(100, Math.max(8, Number(process.env.SERPER_SEARCH_MAX_RESULTS)))
  : Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_MAX_RESULTS))
    ? Math.min(100, Math.max(8, Number(process.env.LOCAL_FALCON_SEARCH_MAX_RESULTS)))
    : 32;
const SEARCH_TARGET_RESULTS = Number.isFinite(Number(process.env.SERPER_SEARCH_TARGET_RESULTS))
  ? Math.min(MAX_RESULTS, Math.max(8, Number(process.env.SERPER_SEARCH_TARGET_RESULTS)))
  : Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_TARGET_RESULTS))
    ? Math.min(MAX_RESULTS, Math.max(8, Number(process.env.LOCAL_FALCON_SEARCH_TARGET_RESULTS)))
    : 16;
const SEARCH_SOFT_TIMEOUT_MS = Number.isFinite(Number(process.env.SERPER_SEARCH_SOFT_TIMEOUT_MS))
  ? Math.max(8_000, Number(process.env.SERPER_SEARCH_SOFT_TIMEOUT_MS))
  : Number.isFinite(Number(process.env.LOCAL_FALCON_SEARCH_SOFT_TIMEOUT_MS))
    ? Math.max(8_000, Number(process.env.LOCAL_FALCON_SEARCH_SOFT_TIMEOUT_MS))
    : 20_000;
const SERPER_RESULTS_PER_PAGE = 10;
const SERPER_MAX_PAGES = Number.isFinite(Number(process.env.SERPER_SEARCH_MAX_PAGES))
  ? Math.min(5, Math.max(1, Number(process.env.SERPER_SEARCH_MAX_PAGES)))
  : Math.max(1, Math.ceil(MAX_RESULTS / SERPER_RESULTS_PER_PAGE));
const GOOGLE_ENRICHMENT_LIMIT = 12;
const GOOGLE_PLACE_LOOKUP_RADIUS_METERS = 5_000;
const ENABLE_SEARCH_DEBUG =
  process.env.SEARCH_DEBUG_LOGS === "true" ||
  process.env.SEARCH_DEBUG_LOGS === "1" ||
  process.env.LOCAL_FALCON_DEBUG_LOGS === "true" ||
  process.env.LOCAL_FALCON_DEBUG_LOGS === "1" ||
  process.env.NODE_ENV !== "production";

type SearchPayload = {
  query: string;
  keyword?: string;
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

type SerperPlaceResult = {
  title?: string;
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  rating?: string | number;
  ratingCount?: string | number;
  phoneNumber?: string;
  website?: string;
  cid?: string | number;
  placeId?: string;
};

type SerperPlacesResponse = {
  places?: SerperPlaceResult[];
  message?: string;
};

type GooglePlacesSearchPlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
};

type GooglePlacesSearchResponse = {
  places?: GooglePlacesSearchPlace[];
  error?: {
    message?: string;
  };
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

function debugLog(message: string, payload: unknown) {
  if (!ENABLE_SEARCH_DEBUG) {
    return;
  }

  console.log(`[business-search] ${message}`, payload);
}

function buildSearchQueries(payload: SearchPayload): string[] {
  const queries = [payload.query.trim()];

  if (payload.keyword) {
    queries.push(`${payload.query} ${payload.keyword}`.trim());
    queries.push(`${payload.keyword} ${payload.query}`.trim());
    queries.push(`${payload.keyword} in ${payload.query}`.trim());
  }

  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery || seen.has(normalizedQuery)) {
      continue;
    }

    seen.add(normalizedQuery);
    deduped.push(query);
  }

  return deduped;
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function buildTokenFrequency(tokens: string[], items: SearchResponseItem[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const token of tokens) {
    frequencies.set(token, 0);
  }

  for (const item of items) {
    const tokenSet = new Set([...tokenize(item.name), ...tokenize(item.address), ...tokenize(item.website ?? "")]);

    for (const token of tokens) {
      if (tokenSet.has(token)) {
        frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
      }
    }
  }

  return frequencies;
}

function getRarityMultiplier(matches: number, total: number): number {
  if (total <= 0) {
    return 1;
  }

  const ratio = matches / total;

  if (ratio <= 0.25) {
    return 3;
  }

  if (ratio <= 0.5) {
    return 2;
  }

  if (ratio <= 0.75) {
    return 1.4;
  }

  return 1;
}

function scoreSearchResult(
  item: SearchResponseItem,
  payload: SearchPayload,
  queryTokens: string[],
  keywordTokens: string[],
  queryTokenFrequency: Map<string, number>,
  totalResults: number,
): number {
  const normalizedName = normalizeText(item.name);
  const normalizedAddress = normalizeText(item.address);
  const normalizedWebsite = normalizeText(item.website ?? "");
  const normalizedQuery = normalizeText(payload.query);
  const normalizedKeyword = normalizeText(payload.keyword ?? "");
  const nameTokens = new Set(tokenize(item.name));
  const addressTokens = new Set(tokenize(item.address));
  const websiteTokens = new Set(tokenize(item.website ?? ""));
  const combinedTokens = new Set([...nameTokens, ...addressTokens, ...websiteTokens]);
  const keywordTokenSet = new Set(keywordTokens);

  let score = 0;

  if (normalizedQuery) {
    if (normalizedName === normalizedQuery) {
      score += 240;
    } else if (normalizedName.startsWith(normalizedQuery)) {
      score += 190;
    } else if (normalizedName.includes(normalizedQuery)) {
      score += 160;
    }
  }

  for (const token of queryTokens) {
    const inName = nameTokens.has(token);
    const inAddress = addressTokens.has(token);
    const inWebsite = websiteTokens.has(token);

    if (!inName && !inAddress && !inWebsite) {
      continue;
    }

    const rarityMultiplier = getRarityMultiplier(
      queryTokenFrequency.get(token) ?? totalResults,
      totalResults,
    );
    const base = inName ? 18 : inAddress ? 6 : 5;
    score += Math.round(base * rarityMultiplier);
  }

  if (queryTokens.length >= 2) {
    const anchorToken = queryTokens[0];

    if (anchorToken.length >= 4 && nameTokens.has(anchorToken) && !keywordTokenSet.has(anchorToken)) {
      score += 24;
    }
  }

  if (normalizedKeyword) {
    const combinedText = `${normalizedName} ${normalizedAddress} ${normalizedWebsite}`;

    if (normalizedName.includes(normalizedKeyword)) {
      score += 40;
    } else if (combinedText.includes(normalizedKeyword)) {
      score += 24;
    }
  }

  for (const token of keywordTokens) {
    if (nameTokens.has(token)) {
      score += 8;
    } else if (combinedTokens.has(token)) {
      score += 4;
    }
  }

  if (queryTokens.length > 0 && !queryTokens.some((token) => nameTokens.has(token) || websiteTokens.has(token))) {
    score -= 8;
  }

  if (item.rating !== null) {
    score += Math.round(item.rating);
  }

  if (item.reviews !== null) {
    score += Math.min(12, Math.round(item.reviews / 50));
  }

  return score;
}

function sortSearchResults(items: SearchResponseItem[], payload: SearchPayload): SearchResponseItem[] {
  if (items.length <= 1) {
    return items;
  }

  const queryTokens = Array.from(new Set(tokenize(payload.query)));
  const keywordTokens = Array.from(new Set(tokenize(payload.keyword ?? "")));
  const queryTokenFrequency = buildTokenFrequency(queryTokens, items);

  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreSearchResult(
        item,
        payload,
        queryTokens,
        keywordTokens,
        queryTokenFrequency,
        items.length,
      ),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const reviewDelta = (right.item.reviews ?? -1) - (left.item.reviews ?? -1);
      if (reviewDelta !== 0) {
        return reviewDelta;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.item);
}

function resolveAnchorToken(payload: SearchPayload): string | null {
  const keywordTokenSet = new Set(tokenize(payload.keyword ?? ""));
  const queryTokens = tokenize(payload.query);

  for (const token of queryTokens) {
    if (token.length >= 4 && !keywordTokenSet.has(token)) {
      return token;
    }
  }

  return null;
}

function hasAnchorTokenMatch(items: SearchResponseItem[], anchorToken: string): boolean {
  return items.some((item) => {
    const tokenSet = new Set([...tokenize(item.name), ...tokenize(item.address), ...tokenize(item.website ?? "")]);
    return tokenSet.has(anchorToken);
  });
}

function buildFallbackPlaceId(result: SerperPlaceResult, name: string, lat: number, lng: number): string {
  const directPlaceId = typeof result.placeId === "string" ? result.placeId.trim() : "";

  if (directPlaceId) {
    return directPlaceId;
  }

  const cid =
    typeof result.cid === "string"
      ? result.cid.trim()
      : typeof result.cid === "number"
        ? String(result.cid)
        : "";

  if (cid) {
    return `cid:${cid}`;
  }

  const slug = normalizeText(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `serper:${slug || "unknown"}:${lat.toFixed(5)}:${lng.toFixed(5)}`;
}

function mapSerperResult(result: SerperPlaceResult): SearchResponseItem | null {
  const name = typeof result.title === "string" ? result.title.trim() : "";
  const lat = toNumber(result.latitude);
  const lng = toNumber(result.longitude);

  if (!name || lat === null || lng === null) {
    return null;
  }

  return {
    placeId: buildFallbackPlaceId(result, name, lat, lng),
    name,
    address: typeof result.address === "string" && result.address.trim().length > 0 ? result.address.trim() : "-",
    lat,
    lng,
    rating: toNumber(result.rating),
    reviews: toNumber(result.ratingCount),
    phone:
      typeof result.phoneNumber === "string" && result.phoneNumber.trim().length > 0
        ? result.phoneNumber.trim()
        : null,
    website:
      typeof result.website === "string" && result.website.trim().length > 0
        ? result.website.trim()
        : null,
  };
}

async function searchSerperPlaces(
  apiKey: string,
  query: string,
  signal: AbortSignal,
): Promise<SerperPlaceResult[]> {
  const querySignal = AbortSignal.any([signal, AbortSignal.timeout(SEARCH_QUERY_TIMEOUT_MS)]);
  const collected: SerperPlaceResult[] = [];

  for (let page = 1; page <= SERPER_MAX_PAGES; page += 1) {
    const startedAt = Date.now();
    const response = await fetch(`${SERPER_BASE_URL}/maps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query,
        gl: SERPER_DEFAULT_GL,
        hl: SERPER_DEFAULT_HL,
        page,
        num: SERPER_RESULTS_PER_PAGE,
      }),
      cache: "no-store",
      signal: querySignal,
    });

    const parsed = (await response.json().catch(() => null)) as SerperPlacesResponse | null;

    debugLog("serper response", {
      query,
      page,
      status: response.status,
      durationMs: Date.now() - startedAt,
      count: Array.isArray(parsed?.places) ? parsed.places.length : 0,
    });

    if (!response.ok) {
      const message =
        parsed && typeof parsed.message === "string" && parsed.message.trim().length > 0
          ? parsed.message
          : "Serper request failed.";

      throw new RouteError(message, response.status >= 400 ? response.status : 502);
    }

    const pageResults = Array.isArray(parsed?.places) ? parsed.places : [];

    if (pageResults.length === 0) {
      break;
    }

    collected.push(...pageResults);

    if (
      collected.length >= MAX_RESULTS ||
      pageResults.length < SERPER_RESULTS_PER_PAGE
    ) {
      break;
    }
  }

  return collected;
}

type SearchCollectResult = {
  hadSuccessfulQuery: boolean;
  recoverableError: unknown | null;
};

async function collectSearchMatches(
  apiKey: string,
  queries: string[],
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
          const results = await searchSerperPlaces(apiKey, query, signal);
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
        const mapped = mapSerperResult(result);

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

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const earthRadiusKm = 6_371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * arc;
}

function computeGoogleCandidateScore(
  item: SearchResponseItem,
  place: GooglePlacesSearchPlace,
): number {
  const candidateName = normalizeText(place.displayName?.text ?? "");
  const candidateAddress = normalizeText(place.formattedAddress ?? "");
  const itemName = normalizeText(item.name);
  const itemAddress = normalizeText(item.address);
  const candidateLat = toNumber(place.location?.latitude);
  const candidateLng = toNumber(place.location?.longitude);

  let score = 0;

  if (candidateName && itemName) {
    if (candidateName === itemName) {
      score += 120;
    } else if (candidateName.includes(itemName) || itemName.includes(candidateName)) {
      score += 70;
    }
  }

  if (candidateAddress && itemAddress) {
    if (candidateAddress.includes(itemAddress) || itemAddress.includes(candidateAddress)) {
      score += 24;
    }
  }

  if (candidateLat !== null && candidateLng !== null) {
    const distanceKm = haversineDistanceKm(item.lat, item.lng, candidateLat, candidateLng);

    if (distanceKm <= 0.2) {
      score += 60;
    } else if (distanceKm <= 1) {
      score += 42;
    } else if (distanceKm <= 3) {
      score += 26;
    } else if (distanceKm <= 10) {
      score += 14;
    }
  }

  return score;
}

function resolveGoogleRegionCode(): string | undefined {
  const region = SERPER_DEFAULT_GL.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(region) ? region : undefined;
}

async function findGooglePlaceForResult(
  googleApiKey: string,
  item: SearchResponseItem,
  payload: SearchPayload,
  signal: AbortSignal,
): Promise<GooglePlacesSearchPlace | null> {
  const regionCode = resolveGoogleRegionCode();
  const requestBody: Record<string, unknown> = {
    textQuery: `${item.name} ${payload.query}`.trim(),
    languageCode: SERPER_DEFAULT_HL,
    maxResultCount: 3,
    locationBias: {
      circle: {
        center: {
          latitude: item.lat,
          longitude: item.lng,
        },
        radius: GOOGLE_PLACE_LOOKUP_RADIUS_METERS,
      },
    },
  };

  if (regionCode) {
    requestBody.regionCode = regionCode;
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/v1/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleApiKey,
      "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
    signal,
  });

  const parsed = (await response.json().catch(() => null)) as GooglePlacesSearchResponse | null;

  if (!response.ok) {
    debugLog("google places enrichment failed", {
      status: response.status,
      message: parsed?.error?.message ?? null,
      placeName: item.name,
    });
    return null;
  }

  const places = Array.isArray(parsed?.places) ? parsed.places : [];

  if (places.length === 0) {
    return null;
  }

  return places
    .map((place) => ({
      place,
      score: computeGoogleCandidateScore(item, place),
    }))
    .sort((left, right) => right.score - left.score)[0]?.place ?? null;
}

async function enrichResultsWithGooglePlaces(
  items: SearchResponseItem[],
  payload: SearchPayload,
  signal: AbortSignal,
): Promise<SearchResponseItem[]> {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();

  if (!googleApiKey) {
    return items;
  }

  const enriched = [...items];
  const limit = Math.min(enriched.length, GOOGLE_ENRICHMENT_LIMIT);

  for (let index = 0; index < limit; index += 1) {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const current = enriched[index];

    if (current.placeId.startsWith("ChI")) {
      continue;
    }

    try {
      const googlePlace = await findGooglePlaceForResult(
        googleApiKey,
        current,
        payload,
        signal,
      );

      if (!googlePlace || !googlePlace.id) {
        continue;
      }

      enriched[index] = {
        ...current,
        placeId: googlePlace.id,
        name:
          typeof googlePlace.displayName?.text === "string" &&
          googlePlace.displayName.text.trim().length > 0
            ? googlePlace.displayName.text.trim()
            : current.name,
        address:
          typeof googlePlace.formattedAddress === "string" &&
          googlePlace.formattedAddress.trim().length > 0
            ? googlePlace.formattedAddress.trim()
            : current.address,
        lat: toNumber(googlePlace.location?.latitude) ?? current.lat,
        lng: toNumber(googlePlace.location?.longitude) ?? current.lng,
        rating: toNumber(googlePlace.rating) ?? current.rating,
        reviews: toNumber(googlePlace.userRatingCount) ?? current.reviews,
        phone:
          typeof googlePlace.nationalPhoneNumber === "string" &&
          googlePlace.nationalPhoneNumber.trim().length > 0
            ? googlePlace.nationalPhoneNumber.trim()
            : current.phone,
        website:
          typeof googlePlace.websiteUri === "string" &&
          googlePlace.websiteUri.trim().length > 0
            ? googlePlace.websiteUri.trim()
            : current.website,
      };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      debugLog("google places enrichment error", {
        placeName: current.name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return enriched;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.SERPER_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "SERPER_API_KEY fehlt in den Umgebungsvariablen.",
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
    const searchQueries = buildSearchQueries(parsedBody);
    const searchStartedAt = Date.now();
    let softTimeoutTriggered = false;

    for (const query of searchQueries) {
      if (combined.size >= MAX_RESULTS || combined.size >= SEARCH_TARGET_RESULTS) {
        break;
      }

      if (combined.size > 0 && Date.now() - searchStartedAt >= SEARCH_SOFT_TIMEOUT_MS) {
        softTimeoutTriggered = true;
        break;
      }

      const collectResult = await collectSearchMatches(
        apiKey,
        [query],
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

    const sortedResults = sortSearchResults(Array.from(combined.values()), parsedBody).slice(
      0,
      MAX_RESULTS,
    );
    const anchorToken = parsedBody.keyword ? resolveAnchorToken(parsedBody) : null;
    const anchorMatchMissing =
      anchorToken !== null &&
      sortedResults.length > 0 &&
      !hasAnchorTokenMatch(sortedResults, anchorToken);

    if (anchorMatchMissing) {
      debugLog("anchor token missing in results", {
        query: parsedBody.query,
        keyword: parsedBody.keyword ?? null,
        anchorToken,
      });
    }

    const guardedResults = anchorMatchMissing ? [] : sortedResults;
    const responseResults = await enrichResultsWithGooglePlaces(
      guardedResults,
      parsedBody,
      controller.signal,
    );

    return NextResponse.json({
      success: true,
      query: parsedBody.query,
      results: responseResults,
    });
  } catch (error) {
    const isRequestAborted = isAbortError(error);

    const message = isRequestAborted
      ? "Die Standortsuche dauert länger als erwartet. Bitte erneut versuchen."
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
