"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Lock as LockIcon,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import {
  buildAnalysisCacheKey,
  clearAnalysisPreloadPending,
  markAnalysisPreloadPending,
  readCachedAnalysisResult,
  writeCachedAnalysisResult,
} from "@/lib/analysis-cache";
import type {
  AnalysisApiResponse,
  AnalysisResult,
} from "@/types/analysis-api";
import type { PreselectedLocation } from "@/types/preselected-location";

type AnalysisResultPageProps = {
  location: string;
  keyword: string;
  selectedLocation: PreselectedLocation | null;
};

type SearchApiSuccess = {
  success: true;
  query: string;
  results: PreselectedLocation[];
};

type SearchApiError = {
  success: false;
  message?: string;
};

type SearchApiResponse = SearchApiSuccess | SearchApiError;
type SearchFetchResult = {
  ok: boolean;
  payload: SearchApiResponse | null;
};

const trustElements = [
  { icon: Shield, text: "DSGVO-konform" },
  { icon: LockIcon, text: "Keine Vertragsbindung" },
  { icon: Check, text: "Transparente Optimierung" },
];

const lockedAnalysisChecklist = [
  "Sichtbarkeits-Score Ihres Standorts",
  "Ranking-Heatmap Ihrer Region",
  "Wettbewerbsvergleich",
  "Konkretes Optimierungspotenzial",
];
const SUBMIT_PRELOAD_WAIT_MS = 2500;
const inFlightBusinessSearches = new Map<string, Promise<SearchFetchResult>>();

function buildBusinessSearchRequestKey(locationValue: string, keywordValue: string) {
  return `${locationValue.trim().toLowerCase()}|${keywordValue.trim().toLowerCase()}`;
}

async function fetchBusinessMatches(
  locationValue: string,
  keywordValue: string,
): Promise<SearchFetchResult> {
  const searchKey = buildBusinessSearchRequestKey(locationValue, keywordValue);
  const existingRequest = inFlightBusinessSearches.get(searchKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetch("/api/local-falcon/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: locationValue.trim(),
        keyword: keywordValue.trim() || undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as SearchApiResponse | null;

    return {
      ok: response.ok,
      payload,
    };
  })().finally(() => {
    inFlightBusinessSearches.delete(searchKey);
  });

  inFlightBusinessSearches.set(searchKey, request);
  return request;
}

type StepProgressProps = {
  step: number;
  total: number;
  label: string;
};

function StepProgress({ step, total, label }: StepProgressProps) {
  const clampedTotal = Math.max(1, total);
  const clampedStep = Math.min(Math.max(1, step), clampedTotal);
  const progressPercent = Math.round((clampedStep / clampedTotal) * 100);

  return (
    <div className="mx-auto mb-5 w-full max-w-xl text-center">
      <p className="text-sm font-medium tracking-tight text-slate-500">
        Schritt {clampedStep} von {clampedTotal} - {label}
      </p>
      <div className="mx-auto mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
        <span>Bereits über 500 lokale Unternehmen analysiert.</span>
      </div>
      <p className="mt-1.5 text-xl font-medium text-emerald-600">
        100 % kostenlos. Keine Verpflichtung.
      </p>
    </div>
  );
}

function LockedVisibilityRing() {
  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle cx="64" cy="8" r="6" fill="#d1d5db" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-slate-500">
        --%
      </div>
    </div>
  );
}

export function AnalysisResultPage({
  location,
  keyword,
  selectedLocation,
}: AnalysisResultPageProps) {
  const router = useRouter();
  const [selectedBusiness, setSelectedBusiness] = useState<PreselectedLocation | null>(
    selectedLocation,
  );
  const [businessMatches, setBusinessMatches] = useState<PreselectedLocation[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(selectedLocation === null);
  const [businessSearchError, setBusinessSearchError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    privacy: false,
  });
  const [isHeatmapImageFailed, setIsHeatmapImageFailed] = useState(false);
  const resolvedReportKeyRef = useRef<string | null>(null);
  const preloadPromiseRef = useRef<Promise<void> | null>(null);
  const forcedScanPreloadKeysRef = useRef<Set<string>>(new Set());
  const businessSearchRequestIdRef = useRef(0);
  const lastSuccessfulBusinessSearchKeyRef = useRef<string | null>(null);
  const lastAutoBusinessSearchKeyRef = useRef<string | null>(null);

  const buildCacheKey = useCallback(
    (
      selectedReportKey?: string,
      businessOverride?: PreselectedLocation | null,
    ) =>
      buildAnalysisCacheKey({
        location,
        keyword,
        selectedLocation: businessOverride ?? selectedBusiness,
        selectedReportKey,
      }),
    [keyword, location, selectedBusiness],
  );

  const storePreloadedResult = useCallback(
    (
      analysisResult: AnalysisResult,
      business: PreselectedLocation,
      reportKey?: string,
      updateResolvedKey = true,
    ) => {
      writeCachedAnalysisResult(buildCacheKey(reportKey, business), analysisResult);
      writeCachedAnalysisResult(buildCacheKey(undefined, business), analysisResult);

      if (analysisResult.report.key) {
        writeCachedAnalysisResult(
          buildCacheKey(analysisResult.report.key, business),
          analysisResult,
        );
      }

      if (updateResolvedKey) {
        resolvedReportKeyRef.current = analysisResult.report.key ?? reportKey ?? null;
      }
    },
    [buildCacheKey],
  );

  const loadBusinessMatches = useCallback(async () => {
    const normalizedLocation = location.trim();
    const normalizedKeyword = keyword.trim();

    if (!normalizedLocation) {
      setBusinessMatches([]);
      setBusinessSearchError("Bitte Standort eingeben.");
      setIsLoadingBusinesses(false);
      return;
    }

    const searchKey = buildBusinessSearchRequestKey(normalizedLocation, normalizedKeyword);
    const requestId = businessSearchRequestIdRef.current + 1;
    businessSearchRequestIdRef.current = requestId;

    setIsLoadingBusinesses(true);
    setBusinessSearchError(null);

    try {
      const { ok, payload } = await fetchBusinessMatches(normalizedLocation, normalizedKeyword);

      if (requestId !== businessSearchRequestIdRef.current) {
        return;
      }

      if (!payload || !ok || payload.success === false) {
        const message =
          payload && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Standortsuche ist fehlgeschlagen.";
        setBusinessMatches((previous) => {
          if (
            lastSuccessfulBusinessSearchKeyRef.current === searchKey &&
            previous.length > 0
          ) {
            return previous;
          }

          return [];
        });
        setBusinessSearchError(message);
        return;
      }

      if (payload.results.length === 0) {
        setBusinessMatches((previous) => {
          if (
            lastSuccessfulBusinessSearchKeyRef.current === searchKey &&
            previous.length > 0
          ) {
            return previous;
          }

          return [];
        });
        setBusinessSearchError(
          "Keine passenden Standorte gefunden. Bitte Firmenname und Stadt prüfen.",
        );
        return;
      }

      setBusinessMatches(payload.results);
      lastSuccessfulBusinessSearchKeyRef.current = searchKey;
    } catch (error) {
      if (requestId !== businessSearchRequestIdRef.current) {
        return;
      }

      setBusinessMatches((previous) => {
        if (
          lastSuccessfulBusinessSearchKeyRef.current === searchKey &&
          previous.length > 0
        ) {
          return previous;
        }

        return [];
      });
      setBusinessSearchError(
        error instanceof Error ? error.message : "Standortsuche ist fehlgeschlagen.",
      );
    } finally {
      if (requestId === businessSearchRequestIdRef.current) {
        setIsLoadingBusinesses(false);
      }
    }
  }, [keyword, location]);

  const preloadAnalysis = useCallback(
    async (
      business: PreselectedLocation,
      requestedReportKey?: string,
      updateResolvedKey = true,
      forceRunScan = false,
    ) => {
      if (!location || !keyword) {
        return;
      }

      const pendingKey = buildCacheKey(undefined, business);
      markAnalysisPreloadPending(pendingKey);
      const pendingHeartbeat = setInterval(() => {
        markAnalysisPreloadPending(pendingKey);
      }, 15_000);

      try {
        const cached = forceRunScan
          ? null
          : readCachedAnalysisResult(buildCacheKey(requestedReportKey, business)) ??
            readCachedAnalysisResult(buildCacheKey(undefined, business));

        if (cached) {
          storePreloadedResult(cached, business, requestedReportKey, updateResolvedKey);
          return;
        }

        let activeReportKey = requestedReportKey;

        for (let attempt = 0; attempt < 6; attempt += 1) {
          const response = await fetch("/api/local-falcon/scan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              location,
              keyword,
              selectedReportKey: activeReportKey,
              forceRunScan,
              selectedLocation: business,
            }),
          });

          const payload = (await response.json().catch(() => null)) as AnalysisApiResponse | null;

          if (!payload) {
            return;
          }

          if (!response.ok || payload.success === false) {
            return;
          }

          if ("pending" in payload && payload.pending === true) {
            const pendingReportKey = payload.report?.key?.trim();

            if (pendingReportKey) {
              activeReportKey = pendingReportKey;
            }

            await new Promise<void>((resolve) => {
              setTimeout(resolve, 2_500);
            });
            continue;
          }

          if (payload.requiresSelection) {
            const autoMatch =
              business.placeId &&
              payload.matches.find(
                (match) => match.placeId && match.placeId === business.placeId,
              );

            if (autoMatch && autoMatch.reportKey !== activeReportKey) {
              activeReportKey = autoMatch.reportKey;
              continue;
            }

            return;
          }

          if (!("business" in payload) || !("metrics" in payload) || !("maps" in payload)) {
            continue;
          }

          storePreloadedResult(payload, business, activeReportKey, updateResolvedKey);
          return;
        }

      } catch {
        // Keep the last known resolved report key to avoid race-condition downgrades.
      } finally {
        clearInterval(pendingHeartbeat);
        clearAnalysisPreloadPending(pendingKey);
      }
    },
    [
      buildCacheKey,
      keyword,
      location,
      storePreloadedResult,
    ],
  );

  useEffect(() => {
    const normalizedLocation = location.trim();
    const normalizedKeyword = keyword.trim();

    if (selectedBusiness || !normalizedLocation) {
      setIsLoadingBusinesses(false);
      return;
    }

    const searchKey = buildBusinessSearchRequestKey(normalizedLocation, normalizedKeyword);

    if (lastAutoBusinessSearchKeyRef.current === searchKey) {
      return;
    }

    lastAutoBusinessSearchKeyRef.current = searchKey;
    void loadBusinessMatches();
  }, [keyword, loadBusinessMatches, location, selectedBusiness]);

  useEffect(() => {
    if (!location || !keyword || !selectedBusiness) {
      preloadPromiseRef.current = null;
      return;
    }

    const forceScanKey = `${location.trim().toLowerCase()}|${keyword.trim().toLowerCase()}|${selectedBusiness.placeId}`;
    const shouldForceRunScan = !forcedScanPreloadKeysRef.current.has(forceScanKey);

    if (shouldForceRunScan) {
      forcedScanPreloadKeysRef.current.add(forceScanKey);
    }

    const preloadTask = preloadAnalysis(
      selectedBusiness,
      undefined,
      true,
      shouldForceRunScan,
    );
    preloadPromiseRef.current = preloadTask;

    void preloadTask.finally(() => {
      if (preloadPromiseRef.current === preloadTask) {
        preloadPromiseRef.current = null;
      }
    });
  }, [keyword, location, preloadAnalysis, selectedBusiness]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    if (!resolvedReportKeyRef.current && preloadPromiseRef.current) {
      await Promise.race([
        preloadPromiseRef.current,
        new Promise<void>((resolve) => {
          setTimeout(resolve, SUBMIT_PRELOAD_WAIT_MS);
        }),
      ]);
    }

    const params = new URLSearchParams();
    if (location.trim().length > 0) {
      params.set("location", location.trim());
    }
    if (keyword.trim().length > 0) {
      params.set("keyword", keyword.trim());
    }
    if (selectedBusiness) {
      params.set("placeId", selectedBusiness.placeId);
      params.set("lat", selectedBusiness.lat.toString());
      params.set("lng", selectedBusiness.lng.toString());
      params.set("businessName", selectedBusiness.name);
      params.set("businessAddress", selectedBusiness.address);

      if (selectedBusiness.rating !== null) {
        params.set("businessRating", selectedBusiness.rating.toString());
      }

      if (selectedBusiness.reviews !== null) {
        params.set("businessReviews", selectedBusiness.reviews.toString());
      }

      if (selectedBusiness.phone) {
        params.set("businessPhone", selectedBusiness.phone);
      }

      if (selectedBusiness.website) {
        params.set("businessUrl", selectedBusiness.website);
      }
    }

    const cachedPreloadedResult =
      readCachedAnalysisResult(buildCacheKey(resolvedReportKeyRef.current ?? undefined)) ??
      readCachedAnalysisResult(buildCacheKey());

    const selectedReportKeyForNavigation =
      resolvedReportKeyRef.current ??
      cachedPreloadedResult?.report.key?.trim() ??
      null;

    if (selectedReportKeyForNavigation) {
      params.set("selectedReportKey", selectedReportKeyForNavigation);
    }

    router.push(`/ergebnisse${params.size > 0 ? `?${params.toString()}` : ""}`);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const isFormValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.phone.trim().length > 0 &&
    formData.privacy;
  const canSubmit = isFormValid && selectedBusiness !== null;

  if (!selectedBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <Navigation />

        <main className="pb-16">
          <section className="mx-auto w-full max-w-5xl px-6 pt-28 pb-8 text-center">
            <StepProgress step={1} total={2} label="Unternehmen auswählen" />
          </section>

          <section className="mx-auto w-full max-w-4xl px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h1 className="text-3xl font-bold text-slate-900">Bitte Unternehmen auswählen</h1>
              <p className="mt-2 text-slate-600">
                Mehrere passende Profile gefunden. Bitte wählen Sie Ihr Unternehmen aus.
              </p>

              {isLoadingBusinesses && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Unternehmen werden geladen...</span>
                </div>
              )}

              {!isLoadingBusinesses && businessSearchError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {businessSearchError}
                </div>
              )}

              {!isLoadingBusinesses && businessMatches.length > 0 && (
                <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {businessMatches.map((match) => (
                    <button
                      key={match.placeId}
                      type="button"
                      onClick={() => {
                        businessSearchRequestIdRef.current += 1;
                        setSelectedBusiness(match);
                        setBusinessSearchError(null);
                        resolvedReportKeyRef.current = null;
                        preloadPromiseRef.current = null;
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <p className="text-sm font-semibold text-slate-900">{match.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{match.address}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadBusinessMatches()}
                  disabled={isLoadingBusinesses}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingBusinesses ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suche läuft...
                    </>
                  ) : (
                    "Erneut suchen"
                  )}
                </button>

                <Link
                  href="/#hero"
                  className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Standort ändern
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="pb-16">
        <section className="mx-auto w-full max-w-5xl px-6 pt-28 pb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
            Ihre Google-Maps-Analyse ist fast bereit.
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Geben Sie Ihre Kontaktdaten ein und erhalten Sie sofort Ihre individuelle
            Standort-Analyse.
          </p>
          <div className="mt-8">
            <StepProgress step={2} total={2} label="Analyse freischalten" />
          </div>
        </section>

        <section className="mx-auto mb-16 w-full max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3 text-sm text-emerald-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-4 w-4 text-emerald-600" />
                </span>
                <p className="text-lg">Ihre Analyse wurde erfolgreich vorbereitet.</p>
              </div>

              <h2 className="mb-6 text-2xl font-bold text-slate-900">Analyse freischalten</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">
                      Vorname *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                      placeholder="Max"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                      Nachname *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                      placeholder="Mustermann"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    E-Mail-Adresse *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    placeholder="max@beispiel.de"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                    WhatsApp-Nummer *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    placeholder="+49 176 12345678"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Wir senden Ihnen Ihre Analyse zusätzlich bequem per WhatsApp zu.
                  </p>
                </div>

                <label className="flex items-start gap-3">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    checked={formData.privacy}
                    onChange={handleChange}
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-600">
                    Ich stimme der{" "}
                    <a href="#" className="text-emerald-600 underline hover:text-emerald-700">
                      Datenschutzerklärung
                    </a>{" "}
                    zu.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full rounded-lg px-6 py-4 font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${
                    canSubmit
                      ? "bg-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-700"
                      : "cursor-not-allowed bg-slate-300"
                  }`}>
                  Meine Analyse freischalten
                </button>

                <p className="text-center text-xs text-slate-500">
                  <Shield className="mr-1 inline h-3 w-3" />
                  Ihre Daten werden nicht weitergegeben.
                </p>
              </form>
            </div>

            <div id="analysis-preview" className="relative">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Ihre aktuelle Google-Maps-Performance
                  </h2>
                  <LockIcon className="h-5 w-5 text-slate-400" />
                </div>

                <p className="mb-6 flex items-start gap-2 text-lg leading-relaxed text-slate-500">
                  <LockIcon className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    Ihre individuelle Analyse wurde erfolgreich vorbereitet und wartet auf
                    Freischaltung.
                  </span>
                </p>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-600">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        Sichtbarkeits-Score
                      </h3>
                      <LockIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-6">
                      <LockedVisibilityRing />
                      <p className="max-w-xs text-xl leading-relaxed text-slate-500">
                        Ergebnisse werden nach Freischaltung angezeigt.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-600">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        Ranking-Heatmap
                      </h3>
                      <LockIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <div className="relative aspect-video w-full">
                        <Image
                          src="/assets/figma/before-ranking.png"
                          alt="Gesperrte Ranking Heatmap"
                          fill
                          className="object-cover opacity-50 blur-[2px]"
                          priority
                          onError={() => setIsHeatmapImageFailed(true)}
                        />
                      </div>
                      {isHeatmapImageFailed && (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
                      )}
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                      Regionale Heatmap wird nach Freischaltung angezeigt.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-600">
                        <Users className="h-5 w-5 text-emerald-500" />
                        Wettbewerbsvergleich
                      </h3>
                      <LockIcon className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="space-y-4 opacity-50">
                        <div className="h-3 w-full rounded bg-slate-300" />
                        <div className="h-3 w-4/5 rounded bg-slate-300" />
                        <div className="h-3 w-3/5 rounded bg-slate-300" />
                        <div className="h-3 w-2/5 rounded bg-slate-300" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                      Wettbewerbsanalyse nach Freischaltung verfügbar.
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                    <p className="text-lg font-medium text-emerald-700">
                      <TrendingUp className="mr-2 inline h-5 w-5" />
                      Durch gezielte Optimierung kann Ihre Sichtbarkeit um{" "}
                      <strong>30-70 %</strong> gesteigert werden.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none mt-6 rounded-3xl border border-slate-200 bg-white/95 p-8 text-center shadow-2xl backdrop-blur md:absolute md:top-[33%] md:right-6 md:left-6 md:mt-0">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <LockIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-4xl font-bold text-slate-900">Ihre Analyse ist bereit.</h3>
                <p className="mt-3 text-xl leading-relaxed text-slate-600">
                  Geben Sie Ihre Kontaktdaten ein, um Ihre individuelle Google-Maps-Analyse sofort
                  freizuschalten.
                </p>

                <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-700">
                  {lockedAnalysisChecklist.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-800">
                  Die Analyse dauert nur wenige Sekunden und ist 100 % kostenlos.
                </div>
                <p className="mt-4 text-sm text-slate-500">Keine Verpflichtung. Keine versteckten Kosten.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-3">
              {trustElements.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
