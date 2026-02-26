import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_FALCON_BASE_URL = "https://api.localfalcon.com";
const DEFAULT_PLATFORM = "google";
const REPORT_LIST_LIMIT = "100";
const MAX_SELECTION_CANDIDATES = 8;
const ON_DEMAND_GRID_SIZE = process.env.LOCAL_FALCON_GRID_SIZE?.trim() || "7";
const ON_DEMAND_RADIUS = process.env.LOCAL_FALCON_RADIUS?.trim() || "5";
const ON_DEMAND_MEASUREMENT = process.env.LOCAL_FALCON_MEASUREMENT?.trim() || "km";
const LOCAL_FALCON_TIMEOUT_MS = Number.isFinite(Number(process.env.LOCAL_FALCON_TIMEOUT_MS))
  ? Math.max(30_000, Number(process.env.LOCAL_FALCON_TIMEOUT_MS))
  : 300_000;
const COMPLETED_ON_DEMAND_SCAN_TTL_MS = 10 * 60 * 1000;
const ENABLE_LOCAL_FALCON_DEBUG =
  process.env.LOCAL_FALCON_DEBUG_LOGS === "true" ||
  process.env.LOCAL_FALCON_DEBUG_LOGS === "1" ||
  process.env.NODE_ENV !== "production";
const REPORT_LIST_SELECTION_FIELDS = [
  "reports.*.report_key",
  "reports.*.timestamp",
  "reports.*.date",
  "reports.*.keyword",
  "reports.*.place_id",
  "reports.*.location.place_id",
  "reports.*.location.name",
  "reports.*.location.address",
].join(",");
const REPORT_DETAIL_FIELDS = [
  "report_key",
  "timestamp",
  "date",
  "keyword",
  "place_id",
  "location.place_id",
  "location.name",
  "location.address",
  "location.rating",
  "location.reviews",
  "location.phone",
  "location.url",
  "points",
  "found_in",
  "arp",
  "atrp",
  "solv",
  "data_points",
  "data_points.*.found",
  "data_points.*.rank",
  "image",
  "heatmap",
  "pdf",
  "public_url",
].join(",");

type LocalFalconEnvelope<T> = {
  code: number;
  code_desc: string | false;
  success: boolean;
  message: string | false;
  data: T;
};

type AnalysisPayload = {
  location: string;
  keyword: string;
  selectedReportKey?: string;
  forceRunScan?: boolean;
  selectedLocation?: {
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
};

type ScanDataPoint = {
  lat: number | string;
  lng: number | string;
  found: boolean;
  rank: number | false;
};

type ScanReportSummary = {
  report_key: string;
  timestamp?: string | number;
  date?: string;
  keyword?: string;
  place_id?: string;
  platform?: string;
  location?: {
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
  lat?: string | number;
  lng?: string | number;
  points?: string | number;
  data_points?: string | number | ScanDataPoint[];
  found_in?: string | number;
  arp?: string | number;
  atrp?: string | number;
  solv?: string | number;
  image?: string;
  heatmap?: string;
  pdf?: string;
  public_url?: string;
};

type ListReportsData = {
  count: number;
  next_token?: string;
  reports: ScanReportSummary[];
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

type OnDemandScanPoint = {
  lat?: string | number;
  lng?: string | number;
  found?: boolean;
  rank?: number | string | false;
};

type OnDemandScanCandidate = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviews: number | null;
  phone: string | null;
  website: string | null;
  keywordScore: number;
  locationScore: number;
};

type MatchSource = "keyword" | "fallback";

type ReportMatch = {
  report: ScanReportSummary;
  source: MatchSource;
  keywordScore: number;
  locationScore: number;
  timestamp: number;
};

type CandidateMatch = {
  reportKey: string;
  placeId: string;
  name: string;
  address: string;
  keyword: string;
  date: string | null;
  timestamp: number;
  matchType: "keyword" | "keyword_location" | "fallback_location";
  keywordScore: number;
  locationScore: number;
};

type SelectionResult =
  | {
      status: "selected";
      selected: CandidateMatch;
      candidates: CandidateMatch[];
    }
  | {
      status: "needs_selection";
      candidates: CandidateMatch[];
    }
  | {
      status: "invalid_selection";
      candidates: CandidateMatch[];
    }
  | {
      status: "not_found";
      reason: "no_keyword_match" | "no_location_match";
    };

class RouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type OnDemandScanResponse = Awaited<ReturnType<typeof runOnDemandScan>>;
type CompletedOnDemandScanEntry = {
  storedAt: number;
  data: OnDemandScanResponse;
};
const inFlightOnDemandScans = new Map<string, Promise<OnDemandScanResponse>>();
const completedOnDemandScans = new Map<string, CompletedOnDemandScanEntry>();

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

  console.log(`[local-falcon/scan] ${message}`, payload);
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

function parsePayload(payload: unknown): AnalysisPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  const location = typeof payload.location === "string" ? payload.location.trim() : "";
  const keyword = typeof payload.keyword === "string" ? payload.keyword.trim() : "";
  const selectedReportKey =
    typeof payload.selectedReportKey === "string" ? payload.selectedReportKey.trim() : "";
  const forceRunScan = payload.forceRunScan === true;
  const rawSelectedLocation = isRecord(payload.selectedLocation)
    ? payload.selectedLocation
    : null;

  if (!location || !keyword) {
    return null;
  }

  let selectedLocation: AnalysisPayload["selectedLocation"] | undefined;

  if (rawSelectedLocation) {
    const placeId =
      typeof rawSelectedLocation.placeId === "string"
        ? rawSelectedLocation.placeId.trim()
        : "";
    const lat = toNumber(rawSelectedLocation.lat);
    const lng = toNumber(rawSelectedLocation.lng);

    if (placeId && lat !== null && lng !== null) {
      selectedLocation = {
        placeId,
        name:
          typeof rawSelectedLocation.name === "string"
            ? rawSelectedLocation.name.trim()
            : "",
        address:
          typeof rawSelectedLocation.address === "string"
            ? rawSelectedLocation.address.trim()
            : "",
        lat,
        lng,
        rating: toNumber(rawSelectedLocation.rating),
        reviews: toNumber(rawSelectedLocation.reviews),
        phone:
          typeof rawSelectedLocation.phone === "string"
            ? rawSelectedLocation.phone.trim()
            : null,
        website:
          typeof rawSelectedLocation.website === "string"
            ? rawSelectedLocation.website.trim()
            : null,
      };
    }
  }

  return {
    location,
    keyword,
    selectedReportKey: selectedReportKey || undefined,
    forceRunScan,
    selectedLocation,
  };
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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildOnDemandScanCacheKey(payload: AnalysisPayload): string {
  const locationPart = normalizeText(payload.location);
  const keywordPart = normalizeText(payload.keyword);
  const placeIdPart = payload.selectedLocation?.placeId?.trim() || "none";

  return `${locationPart}|${keywordPart}|${placeIdPart}`;
}

function readCompletedOnDemandScan(cacheKey: string): OnDemandScanResponse | null {
  const cached = completedOnDemandScans.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.storedAt > COMPLETED_ON_DEMAND_SCAN_TTL_MS) {
    completedOnDemandScans.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function writeCompletedOnDemandScan(cacheKey: string, payload: OnDemandScanResponse) {
  completedOnDemandScans.set(cacheKey, {
    storedAt: Date.now(),
    data: payload,
  });
}

async function runOrJoinOnDemandScan(
  apiKey: string,
  payload: AnalysisPayload,
  signal: AbortSignal,
): Promise<OnDemandScanResponse> {
  const cacheKey = buildOnDemandScanCacheKey(payload);
  const cached = readCompletedOnDemandScan(cacheKey);

  if (cached) {
    return cached;
  }

  const inFlight = inFlightOnDemandScans.get(cacheKey);

  if (inFlight) {
    return inFlight;
  }

  const task = (async () => {
    const result = await runOnDemandScan(apiKey, payload, signal);
    writeCompletedOnDemandScan(cacheKey, result);
    return result;
  })();

  inFlightOnDemandScans.set(cacheKey, task);

  try {
    return await task;
  } finally {
    if (inFlightOnDemandScans.get(cacheKey) === task) {
      inFlightOnDemandScans.delete(cacheKey);
    }
  }
}

function scoreTextMatch(haystack: string, needle: string): number {
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);

  if (!normalizedHaystack || !normalizedNeedle) {
    return 0;
  }

  let score = 0;

  if (normalizedHaystack.includes(normalizedNeedle)) {
    score += 12;
  }

  const tokens = normalizedNeedle.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);

  for (const token of tokens) {
    if (normalizedHaystack.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function rankReports(reports: ScanReportSummary[], payload: AnalysisPayload, source: MatchSource): ReportMatch[] {
  return reports
    .map((report) => {
      const keywordScore = scoreTextMatch(report.keyword ?? "", payload.keyword);
      const locationScore = scoreTextMatch(
        `${report.location?.name ?? ""} ${report.location?.address ?? ""}`,
        payload.location,
      );
      const timestamp = toNumber(report.timestamp) ?? 0;

      return { report, source, keywordScore, locationScore, timestamp };
    })
    .sort((left, right) => {
      if (right.locationScore !== left.locationScore) {
        return right.locationScore - left.locationScore;
      }

      if (right.keywordScore !== left.keywordScore) {
        return right.keywordScore - left.keywordScore;
      }

      return right.timestamp - left.timestamp;
    });
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

async function listReports(
  apiKey: string,
  body: Record<string, string>,
  signal: AbortSignal,
): Promise<ScanReportSummary[]> {
  const response = await postLocalFalcon<ListReportsData>(
    "/v1/reports/",
    {
      api_key: apiKey,
      limit: REPORT_LIST_LIMIT,
      platform: DEFAULT_PLATFORM,
      fields: REPORT_LIST_SELECTION_FIELDS,
      ...body,
    },
    signal,
  );

  return Array.isArray(response.data?.reports) ? response.data.reports : [];
}

type LocationSearchQuery = {
  name: string;
  proximity?: string;
};

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
    const [name, ...rest] = trimmedLocation.split(",").map((segment) => segment.trim()).filter(Boolean);
    const proximity = rest.join(", ").trim();

    if (name && proximity) {
      pushQuery(name, proximity);
    }
  }

  if (/\sin\s/i.test(trimmedLocation)) {
    const [name, proximity] = trimmedLocation.split(/\sin\s/i).map((segment) => segment.trim());
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

async function searchAccountLocations(
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

function selectBestOnDemandCandidate(
  results: AccountLocationSearchResult[],
  payload: AnalysisPayload,
): OnDemandScanCandidate | null {
  const candidates = results
    .map((result) => {
      const placeId = result.place_id?.trim() ?? "";
      const name = result.name?.trim() ?? "";
      const address = result.address?.trim() ?? "";
      const lat = toNumber(result.lat);
      const lng = toNumber(result.lng);

      if (!placeId || lat === null || lng === null) {
        return null;
      }

      return {
        placeId,
        name: name || "Unbekanntes Profil",
        address: address || "-",
        lat,
        lng,
        rating: toNumber(result.rating),
        reviews: toNumber(result.reviews),
        phone: result.phone?.toString() ?? null,
        website: result.url?.toString() ?? null,
        keywordScore: scoreTextMatch(name, payload.keyword),
        locationScore: scoreTextMatch(`${name} ${address}`, payload.location),
      } satisfies OnDemandScanCandidate;
    })
    .filter((candidate): candidate is OnDemandScanCandidate => candidate !== null)
    .sort((left, right) => {
      if (right.locationScore !== left.locationScore) {
        return right.locationScore - left.locationScore;
      }

      if (right.keywordScore !== left.keywordScore) {
        return right.keywordScore - left.keywordScore;
      }

      return (right.reviews ?? 0) - (left.reviews ?? 0);
    });

  return candidates[0] ?? null;
}

async function resolveOnDemandScanCandidate(
  apiKey: string,
  payload: AnalysisPayload,
  signal: AbortSignal,
): Promise<OnDemandScanCandidate> {
  if (payload.selectedLocation) {
    const selected = payload.selectedLocation;
    const fallbackName = selected.name || "Ausgewaehltes Profil";
    const fallbackAddress = selected.address || payload.location;

    return {
      placeId: selected.placeId,
      name: fallbackName,
      address: fallbackAddress,
      lat: selected.lat,
      lng: selected.lng,
      rating: selected.rating,
      reviews: selected.reviews,
      phone: selected.phone,
      website: selected.website,
      keywordScore: scoreTextMatch(fallbackName, payload.keyword),
      locationScore: scoreTextMatch(`${fallbackName} ${fallbackAddress}`, payload.location),
    };
  }

  const searchQueries = buildLocationSearchQueries(payload.location);
  let selectedResults: AccountLocationSearchResult[] = [];

  for (const query of searchQueries) {
    const queryResults = await searchAccountLocations(apiKey, query, signal);

    if (queryResults.length > 0) {
      selectedResults = queryResults;
      break;
    }
  }

  if (selectedResults.length === 0) {
    const keywordFirstQueries = buildLocationSearchQueries(
      `${payload.keyword} ${payload.location}`,
    );

    for (const query of keywordFirstQueries) {
      const queryResults = await searchAccountLocations(apiKey, query, signal);

      if (queryResults.length > 0) {
        selectedResults = queryResults;
        break;
      }
    }
  }

  if (selectedResults.length === 0) {
    const queryFirstQueries = buildLocationSearchQueries(
      `${payload.location} ${payload.keyword}`,
    );

    for (const query of queryFirstQueries) {
      const queryResults = await searchAccountLocations(apiKey, query, signal);

      if (queryResults.length > 0) {
        selectedResults = queryResults;
        break;
      }
    }
  }

  const selectedCandidate = selectBestOnDemandCandidate(selectedResults, payload);

  if (!selectedCandidate) {
    throw new RouteError(
      `Kein passender Standort fuer "${payload.location}" gefunden. Bitte geben Sie den Firmennamen mit Stadt oder Adresse an.`,
      404,
    );
  }

  return selectedCandidate;
}

function normalizeOnDemandPoints(rawPoints: OnDemandScanPoint[] | undefined): ScanDataPoint[] {
  if (!Array.isArray(rawPoints)) {
    return [];
  }

  const normalized: ScanDataPoint[] = [];

  for (const point of rawPoints) {
    const lat = toNumber(point.lat);
    const lng = toNumber(point.lng);

    if (lat === null || lng === null) {
      continue;
    }

    const normalizedRank = point.rank === false ? false : toNumber(point.rank);
    const rank = normalizedRank === null ? false : normalizedRank;

    normalized.push({
      lat,
      lng,
      found: typeof point.found === "boolean" ? point.found : rank !== false,
      rank,
    });
  }

  return normalized;
}

async function runOnDemandScan(
  apiKey: string,
  payload: AnalysisPayload,
  signal: AbortSignal,
) {
  const candidate = await resolveOnDemandScanCandidate(apiKey, payload, signal);

  await postLocalFalcon<Record<string, never>[]>(
    "/v2/locations/add",
    {
      api_key: apiKey,
      platform: DEFAULT_PLATFORM,
      place_id: candidate.placeId,
    },
    signal,
  );

  const scanResponse = await postLocalFalcon<ScanReportSummary>(
    "/v2/run-scan/",
    {
      api_key: apiKey,
      platform: DEFAULT_PLATFORM,
      place_id: candidate.placeId,
      keyword: payload.keyword,
      lat: candidate.lat.toString(),
      lng: candidate.lng.toString(),
      grid_size: ON_DEMAND_GRID_SIZE,
      radius: ON_DEMAND_RADIUS,
      measurement: ON_DEMAND_MEASUREMENT,
    },
    signal,
  );

  const scanData = scanResponse.data;
  const pointsFromArray = normalizeOnDemandPoints(
    Array.isArray(scanData.data_points)
      ? (scanData.data_points as OnDemandScanPoint[])
      : undefined,
  );

  if (pointsFromArray.length === 0) {
    throw new RouteError(
      "Der neue Scan wurde gestartet, liefert aber noch keine Datenpunkte. Bitte in 1-2 Minuten erneut versuchen.",
      502,
    );
  }

  const rankSummary = summarizeRanks(pointsFromArray);

  const pointsCount =
    toNumber(scanData.points) ??
    pointsFromArray.length;

  const top10Rate = pointsCount > 0 ? Math.round((rankSummary.top10 / pointsCount) * 100) : 0;
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    success: true,
    requiresSelection: false,
    message: "Kein bestehender Report gefunden. Ein neuer Local-Falcon-Scan wurde automatisch erstellt.",
    input: {
      location: payload.location,
      keyword: payload.keyword,
    },
    business: {
      placeId: candidate.placeId,
      name: scanData.location?.name ?? candidate.name,
      address: scanData.location?.address ?? candidate.address,
      rating: toNumber(scanData.location?.rating) ?? candidate.rating,
      reviews: toNumber(scanData.location?.reviews) ?? candidate.reviews,
      phone: scanData.location?.phone?.toString() ?? candidate.phone,
      website: scanData.location?.url ?? candidate.website,
    },
    metrics: {
      points: pointsCount,
      foundIn: toNumber(scanData.found_in) ?? rankSummary.top20,
      arp: toNumber(scanData.arp),
      atrp: toNumber(scanData.atrp),
      solv: toNumber(scanData.solv),
      top3: rankSummary.top3,
      top10: rankSummary.top10,
      top20: rankSummary.top20,
      notFound: rankSummary.notFound,
      top10Rate,
    },
    maps: {
      before: scanData.image ?? null,
      heatmap: scanData.heatmap ?? null,
      afterDemo: "/assets/figma/after-ranking.png",
    },
    report: {
      key: scanData.report_key ?? null,
      publicUrl: scanData.public_url ?? null,
      pdf: scanData.pdf ?? null,
      date: scanData.date ?? null,
      timestamp: toNumber(scanData.timestamp) ?? timestamp,
    },
    selection: {
      matchType: "fallback_location" as const,
      keywordScore: candidate.keywordScore,
      locationScore: candidate.locationScore,
      candidates: 1,
    },
  };
}

function buildCandidateMatches(matches: ReportMatch[]): CandidateMatch[] {
  const uniqueKeys = new Set<string>();
  const candidates: CandidateMatch[] = [];

  for (const match of matches) {
    const report = match.report;
    const name = report.location?.name ?? "";
    const address = report.location?.address ?? "";
    const placeId = report.location?.place_id ?? report.place_id ?? "";
    const dedupKey = placeId || `${normalizeText(name)}|${normalizeText(address)}` || report.report_key;

    if (!dedupKey || uniqueKeys.has(dedupKey)) {
      continue;
    }

    uniqueKeys.add(dedupKey);

    candidates.push({
      reportKey: report.report_key,
      placeId,
      name: name || "Unbekanntes Profil",
      address: address || "-",
      keyword: report.keyword ?? "",
      date: report.date ?? null,
      timestamp: toNumber(report.timestamp) ?? 0,
      matchType: match.source === "fallback" ? "fallback_location" : match.locationScore > 0 ? "keyword_location" : "keyword",
      keywordScore: match.keywordScore,
      locationScore: match.locationScore,
    });
  }

  return candidates;
}

function findCandidateBySelectedLocation(
  candidates: CandidateMatch[],
  selectedLocation: NonNullable<AnalysisPayload["selectedLocation"]>,
): CandidateMatch | null {
  if (selectedLocation.placeId) {
    const placeIdMatch = candidates.find(
      (candidate) =>
        candidate.placeId &&
        candidate.placeId === selectedLocation.placeId,
    );

    if (placeIdMatch) {
      return placeIdMatch;
    }
  }

  const normalizedName = normalizeText(selectedLocation.name);
  const normalizedAddress = normalizeText(selectedLocation.address);

  if (!normalizedName) {
    return null;
  }

  const exactNameMatch = candidates.find(
    (candidate) => normalizeText(candidate.name) === normalizedName,
  );

  if (exactNameMatch) {
    return exactNameMatch;
  }

  if (normalizedAddress) {
    const combinedMatch = candidates.find((candidate) => {
      const candidateName = normalizeText(candidate.name);
      const candidateAddress = normalizeText(candidate.address);

      return (
        candidateName.includes(normalizedName) &&
        candidateAddress.includes(normalizedAddress)
      );
    });

    if (combinedMatch) {
      return combinedMatch;
    }
  }

  return null;
}

async function resolveSelection(apiKey: string, payload: AnalysisPayload, signal: AbortSignal): Promise<SelectionResult> {
  const keywordReports = await listReports(
    apiKey,
    {
      keyword: payload.keyword,
    },
    signal,
  );

  if (keywordReports.length === 0) {
    return { status: "not_found", reason: "no_keyword_match" };
  }

  const rankedMatches = rankReports(keywordReports, payload, "keyword");
  const keywordScopedMatches = rankedMatches.filter((match) => match.keywordScore > 0);

  if (keywordScopedMatches.length === 0) {
    return { status: "not_found", reason: "no_keyword_match" };
  }

  if (payload.selectedLocation) {
    const selectedLocationCandidates = buildCandidateMatches(keywordScopedMatches);

    if (selectedLocationCandidates.length === 0) {
      return { status: "not_found", reason: "no_keyword_match" };
    }

    if (payload.selectedReportKey) {
      const selectedByReportKey = selectedLocationCandidates.find(
        (candidate) => candidate.reportKey === payload.selectedReportKey,
      );

      if (selectedByReportKey) {
        return {
          status: "selected",
          selected: selectedByReportKey,
          candidates: selectedLocationCandidates,
        };
      }
    }

    const selectedByLocation = findCandidateBySelectedLocation(
      selectedLocationCandidates,
      payload.selectedLocation,
    );

    if (selectedByLocation) {
      return {
        status: "selected",
        selected: selectedByLocation,
        candidates: selectedLocationCandidates,
      };
    }

    if (payload.selectedReportKey) {
      return { status: "invalid_selection", candidates: selectedLocationCandidates };
    }

    return { status: "not_found", reason: "no_location_match" };
  }

  const locationScopedMatches = keywordScopedMatches.filter((match) => match.locationScore > 0);

  if (locationScopedMatches.length === 0) {
    return { status: "not_found", reason: "no_location_match" };
  }

  const candidates = buildCandidateMatches(locationScopedMatches);

  if (candidates.length === 0) {
    return { status: "not_found", reason: "no_location_match" };
  }

  if (payload.selectedReportKey) {
    const selected = candidates.find((candidate) => candidate.reportKey === payload.selectedReportKey);

    if (selected) {
      return { status: "selected", selected, candidates };
    }
  }

  if (payload.selectedReportKey) {
    return { status: "invalid_selection", candidates };
  }

  if (candidates.length === 1) {
    return {
      status: "selected",
      selected: candidates[0],
      candidates,
    };
  }

  return {
    status: "needs_selection",
    candidates,
  };
}

function summarizeRanks(dataPoints: ScanDataPoint[]) {
  const summary = {
    top3: 0,
    top10: 0,
    top20: 0,
    notFound: 0,
  };

  for (const point of dataPoints) {
    const rank = point.rank;

    if (rank === false) {
      summary.notFound += 1;
      continue;
    }

    if (rank <= 3) {
      summary.top3 += 1;
      summary.top10 += 1;
      summary.top20 += 1;
      continue;
    }

    if (rank <= 10) {
      summary.top10 += 1;
      summary.top20 += 1;
      continue;
    }

    if (rank <= 20) {
      summary.top20 += 1;
    }
  }

  return summary;
}

function buildAnalysisResponseFromReport(
  payload: AnalysisPayload,
  reportData: ScanReportSummary,
  fallbackBusiness: {
    placeId: string;
    name: string;
    address: string;
    rating: number | null;
    reviews: number | null;
    phone: string | null;
    website: string | null;
  },
  selection: {
    matchType: "keyword" | "keyword_location" | "fallback_location";
    keywordScore: number;
    locationScore: number;
    candidates: number;
  },
) {
  const pointsFromArray = Array.isArray(reportData.data_points) ? reportData.data_points : [];

  const pointsCount =
    toNumber(reportData.points) ??
    toNumber(Array.isArray(reportData.data_points) ? pointsFromArray.length : reportData.data_points) ??
    pointsFromArray.length;

  const rankSummary = summarizeRanks(pointsFromArray);
  const top10Rate = pointsCount > 0 ? Math.round((rankSummary.top10 / pointsCount) * 100) : 0;

  return {
    success: true,
    requiresSelection: false as const,
    input: {
      location: payload.location,
      keyword: payload.keyword,
    },
    business: {
      placeId: reportData.location?.place_id ?? reportData.place_id ?? fallbackBusiness.placeId,
      name: reportData.location?.name ?? fallbackBusiness.name,
      address: reportData.location?.address ?? fallbackBusiness.address,
      rating: toNumber(reportData.location?.rating) ?? fallbackBusiness.rating,
      reviews: toNumber(reportData.location?.reviews) ?? fallbackBusiness.reviews,
      phone: reportData.location?.phone?.toString() ?? fallbackBusiness.phone,
      website: reportData.location?.url ?? fallbackBusiness.website,
    },
    metrics: {
      points: pointsCount,
      foundIn: toNumber(reportData.found_in) ?? rankSummary.top20,
      arp: toNumber(reportData.arp),
      atrp: toNumber(reportData.atrp),
      solv: toNumber(reportData.solv),
      top3: rankSummary.top3,
      top10: rankSummary.top10,
      top20: rankSummary.top20,
      notFound: rankSummary.notFound,
      top10Rate,
    },
    maps: {
      before: reportData.image ?? null,
      heatmap: reportData.heatmap ?? null,
      afterDemo: "/assets/figma/after-ranking.png",
    },
    report: {
      key: reportData.report_key ?? null,
      publicUrl: reportData.public_url ?? null,
      pdf: reportData.pdf ?? null,
      date: reportData.date ?? null,
      timestamp: toNumber(reportData.timestamp) ?? null,
    },
    selection,
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
        message: "Bitte Standort und Keyword angeben.",
      },
      { status: 400 },
    );
  }

  debugLog("incoming request", {
    location: parsedBody.location,
    keyword: parsedBody.keyword,
    selectedReportKey: parsedBody.selectedReportKey ?? null,
    forceRunScan: parsedBody.forceRunScan === true,
    selectedLocation: parsedBody.selectedLocation
      ? {
          placeId: parsedBody.selectedLocation.placeId,
          name: parsedBody.selectedLocation.name,
          lat: parsedBody.selectedLocation.lat,
          lng: parsedBody.selectedLocation.lng,
        }
      : null,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOCAL_FALCON_TIMEOUT_MS);
  const onDemandScanKey = buildOnDemandScanCacheKey(parsedBody);

  try {
    if (!parsedBody.selectedReportKey) {
      const cachedOnDemandScan = readCompletedOnDemandScan(onDemandScanKey);

      if (cachedOnDemandScan) {
        return NextResponse.json(cachedOnDemandScan);
      }

      const inFlightOnDemandScan = inFlightOnDemandScans.get(onDemandScanKey);

      if (inFlightOnDemandScan) {
        return NextResponse.json(await inFlightOnDemandScan);
      }
    }

    if (parsedBody.forceRunScan) {
      const generatedScan = await runOrJoinOnDemandScan(apiKey, parsedBody, controller.signal);
      return NextResponse.json(generatedScan);
    }

    if (parsedBody.selectedReportKey) {
      try {
        const directReport = await postLocalFalcon<ScanReportSummary>(
          `/v1/reports/${parsedBody.selectedReportKey}/`,
          {
            api_key: apiKey,
            fields: REPORT_DETAIL_FIELDS,
          },
          controller.signal,
        );

        const directBusinessFallback = {
          placeId: parsedBody.selectedLocation?.placeId ?? "",
          name: parsedBody.selectedLocation?.name || "Ausgewaehltes Profil",
          address: parsedBody.selectedLocation?.address || parsedBody.location,
          rating: parsedBody.selectedLocation?.rating ?? null,
          reviews: parsedBody.selectedLocation?.reviews ?? null,
          phone: parsedBody.selectedLocation?.phone ?? null,
          website: parsedBody.selectedLocation?.website ?? null,
        };

        return NextResponse.json(
          buildAnalysisResponseFromReport(
            parsedBody,
            directReport.data,
            directBusinessFallback,
            {
              matchType: parsedBody.selectedLocation ? "keyword_location" : "keyword",
              keywordScore: scoreTextMatch(directReport.data.keyword ?? "", parsedBody.keyword),
              locationScore: scoreTextMatch(
                `${directReport.data.location?.name ?? ""} ${directReport.data.location?.address ?? ""}`,
                parsedBody.location,
              ),
              candidates: 1,
            },
          ),
        );
      } catch (error) {
        const shouldFallbackToSelection =
          error instanceof RouteError &&
          (error.status === 400 || error.status === 404 || error.status === 422);

        if (!shouldFallbackToSelection) {
          throw error;
        }
      }
    }

    const selection = await resolveSelection(apiKey, parsedBody, controller.signal);

    if (selection.status === "not_found") {
      const generatedScan = await runOrJoinOnDemandScan(apiKey, parsedBody, controller.signal);
      return NextResponse.json(generatedScan);
    }

    if (selection.status === "needs_selection" || selection.status === "invalid_selection") {
      return NextResponse.json({
        success: true,
        requiresSelection: true,
        message:
          selection.status === "invalid_selection"
            ? "Die Auswahl war nicht gueltig. Bitte waehlen Sie ein Profil erneut aus."
            : "Mehrere passende Profile gefunden. Bitte waehlen Sie Ihr Unternehmen aus.",
        input: {
          location: parsedBody.location,
          keyword: parsedBody.keyword,
        },
        matches: selection.candidates.slice(0, MAX_SELECTION_CANDIDATES),
      });
    }

    const report = await postLocalFalcon<ScanReportSummary>(
      `/v1/reports/${selection.selected.reportKey}/`,
      {
        api_key: apiKey,
        fields: REPORT_DETAIL_FIELDS,
      },
      controller.signal,
    );

    const reportData = report.data;
    const fallbackBusiness = {
      placeId: selection.selected.placeId,
      name: selection.selected.name,
      address: selection.selected.address,
      rating: null,
      reviews: null,
      phone: null,
      website: null,
    };

    const responsePayload = buildAnalysisResponseFromReport(
      parsedBody,
      reportData,
      fallbackBusiness,
      {
        matchType: selection.selected.matchType,
        keywordScore: selection.selected.keywordScore,
        locationScore: selection.selected.locationScore,
        candidates: selection.candidates.length,
      },
    );

    if (!responsePayload.report.key && selection.selected.reportKey) {
      responsePayload.report.key = selection.selected.reportKey;
    }

    if (!responsePayload.report.date && selection.selected.date) {
      responsePayload.report.date = selection.selected.date;
    }

    if (responsePayload.report.timestamp === null && selection.selected.timestamp) {
      responsePayload.report.timestamp = selection.selected.timestamp;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    const isAbortError =
      error instanceof DOMException
        ? error.name === "AbortError"
        : error instanceof Error && error.message.toLowerCase().includes("aborted");

    const message = isAbortError
      ? "Die Berichtsdaten brauchen laenger als erwartet. Bitte erneut versuchen."
      : error instanceof Error
        ? error.message
        : "Analyse konnte nicht geladen werden.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status:
          error instanceof RouteError
            ? error.status
            : 500,
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
