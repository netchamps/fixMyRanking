"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Star,
  Users,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import type { PreselectedLocation } from "@/types/preselected-location";

type AnalysisResultsPageProps = {
  location: string;
  keyword: string;
  selectedLocation: PreselectedLocation | null;
};

type SelectionMatch = {
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

type AnalysisSelectionRequired = {
  success: true;
  requiresSelection: true;
  message?: string;
  input: {
    location: string;
    keyword: string;
  };
  matches: SelectionMatch[];
};

type AnalysisResult = {
  success: true;
  requiresSelection: false;
  message?: string;
  input: {
    location: string;
    keyword: string;
  };
  business: {
    placeId: string;
    name: string;
    address: string;
    rating: number | null;
    reviews: number | null;
    phone: string | null;
    website: string | null;
  };
  metrics: {
    points: number;
    foundIn: number;
    arp: number | null;
    atrp: number | null;
    solv: number | null;
    top3: number;
    top10: number;
    top20: number;
    notFound: number;
    top10Rate: number;
  };
  maps: {
    before: string | null;
    heatmap: string | null;
    afterDemo: string;
  };
  report: {
    key: string | null;
    publicUrl: string | null;
    pdf: string | null;
    date: string | null;
    timestamp: number | null;
  };
  selection: {
    matchType: "keyword" | "keyword_location" | "fallback_location";
    keywordScore: number;
    locationScore: number;
    candidates: number;
  };
};

type AnalysisErrorPayload = {
  success: false;
  message?: string;
};

type AnalysisApiResponse =
  | AnalysisResult
  | AnalysisSelectionRequired
  | AnalysisErrorPayload;

type Segment = {
  label: string;
  value: number;
  color: string;
};

function formatMetric(value: number | null, suffix = "") {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)}${suffix}`;
}

function formatReportDate(date: string | null, timestamp: number | null) {
  if (date) {
    return date;
  }

  if (timestamp === null) {
    return "-";
  }

  return new Date(timestamp * 1000).toLocaleDateString("de-DE");
}

function getMatchTypeLabel(matchType: AnalysisResult["selection"]["matchType"]) {
  switch (matchType) {
    case "keyword_location":
      return "Keyword + Standort";
    case "fallback_location":
      return "Standort-Fallback";
    case "keyword":
    default:
      return "Keyword";
  }
}

function SegmentBars({ segments }: { segments: Segment[] }) {
  return (
    <div className="space-y-4">
      {segments.map((segment) => (
        <div key={segment.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{segment.label}</span>
            <span className="font-semibold text-slate-900">{segment.value}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${segment.color}`}
              style={{ width: `${Math.max(0, Math.min(100, segment.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <section className="mx-auto mb-16 w-full max-w-5xl px-6">
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm text-emerald-800">Local-Falcon-Daten werden geladen.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded-2xl bg-emerald-100/70" />
          <div className="h-40 animate-pulse rounded-2xl bg-emerald-100/70" />
          <div className="h-40 animate-pulse rounded-2xl bg-emerald-100/70" />
        </div>
      </div>
    </section>
  );
}

export function AnalysisResultsPage({
  location,
  keyword,
  selectedLocation,
}: AnalysisResultsPageProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectionMatches, setSelectionMatches] = useState<SelectionMatch[]>([]);
  const [selectionMessage, setSelectionMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorJson, setErrorJson] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (selectedReportKey?: string) => {
      setIsLoading(true);
      setError(null);
      setErrorJson(null);

      try {
        const response = await fetch("/api/local-falcon/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location,
            keyword,
            selectedReportKey,
            selectedLocation,
          }),
        });

        const payload = (await response.json().catch(() => null)) as AnalysisApiResponse | null;

        if (!payload) {
          const message = "Analyse konnte nicht geladen werden.";
          setError(message);
          setErrorJson(
            JSON.stringify(
              {
                status: response.status,
                payload: { success: false, message },
              },
              null,
              2,
            ),
          );
          return;
        }

        if (!response.ok || payload.success === false) {
          const message =
            payload && "message" in payload && typeof payload.message === "string"
              ? payload.message
              : "Analyse konnte nicht geladen werden.";

          const fallbackPayload = payload ?? { success: false, message };
          setError(message);
          setErrorJson(
            JSON.stringify(
              {
                status: response.status,
                payload: fallbackPayload,
              },
              null,
              2,
            ),
          );
          return;
        }

        if (payload.requiresSelection === true) {
          setResult(null);
          setSelectionMatches(payload.matches);
          setSelectionMessage(
            payload.message ??
              "Mehrere passende Profile gefunden. Bitte waehlen Sie Ihr Unternehmen aus.",
          );
          return;
        }

        setResult(payload);
        setSelectionMatches([]);
        setSelectionMessage("");
      } catch (analysisError) {
        const message =
          analysisError instanceof Error
            ? analysisError.message
            : "Analyse konnte nicht geladen werden.";
        setError(message);
        setErrorJson(
          JSON.stringify(
            {
              success: false,
              message,
            },
            null,
            2,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, location, selectedLocation],
  );

  useEffect(() => {
    if (!location || !keyword) {
      setIsLoading(false);
      return;
    }

    void runAnalysis();
  }, [keyword, location, runAnalysis]);

  const analysisDate = useMemo(() => {
    if (!result) {
      return new Date().toLocaleDateString("de-DE");
    }

    return formatReportDate(result.report.date, result.report.timestamp);
  }, [result]);

  if (!location || !keyword) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <Navigation />
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-32 pb-16 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Bitte Analyseparameter angeben</h1>
          <p className="mt-4 text-lg text-slate-600">
            Starten Sie die Analyse auf der Startseite mit Standort und Keyword.
          </p>
          <Link
            href="/#hero"
            className="mt-8 inline-flex rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-600"
          >
            Zur Startseite
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const points = result?.metrics.points ?? 0;
  const top3Rate = points > 0 ? Math.round((result!.metrics.top3 / points) * 100) : 0;
  const top10Rate = result?.metrics.top10Rate ?? 0;
  const midRate = Math.max(0, top10Rate - top3Rate);
  const lowRate = Math.max(0, 100 - top10Rate);

  const heatmapSource =
    result?.maps.before ?? result?.maps.heatmap ?? "/assets/figma/before-ranking.png";

  const kpis = [
    {
      value: `${top3Rate}%`,
      label: "Top-3-Sichtbarkeit",
      subtext:
        result && points > 0
          ? `${result.metrics.top3} von ${points} Datenpunkten liegen in den Top 3.`
          : "Wird aus dem ausgewaehlten Report berechnet.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      value: `${top10Rate}%`,
      label: "Top-10-Abdeckung",
      subtext:
        result && points > 0
          ? `${result.metrics.top10} von ${points} Datenpunkten sind in den Top 10 sichtbar.`
          : "Wird aus dem ausgewaehlten Report berechnet.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      value: result ? formatMetric(result.metrics.arp) : "-",
      label: "Durchschnittsranking (ARP)",
      subtext:
        result && result.metrics.solv !== null
          ? `SoLV: ${formatMetric(result.metrics.solv, "%")} bei ${result.metrics.foundIn} gefundenen Punkten.`
          : "Wird aus dem ausgewaehlten Report berechnet.",
      color: "text-slate-700",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
    },
  ];

  const distributionSegments: Segment[] = [
    { label: "Top 3", value: top3Rate, color: "bg-emerald-500" },
    { label: "Top 10 (4-10)", value: midRate, color: "bg-yellow-500" },
    { label: "Ab 11 / Nicht gefunden", value: lowRate, color: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="pt-24 pb-16">
        <section className="mx-auto mb-16 w-full max-w-5xl px-6">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
            <p className="text-sm text-slate-600">
              {isLoading
                ? "Ihre Analyse wird geladen"
                : error
                  ? "Analyse konnte nicht geladen werden"
                  : `Ihre Analyse wurde erfolgreich durchgefuehrt am ${analysisDate}`}
            </p>
          </div>

          <h1 className="mb-6 text-center text-5xl leading-tight font-bold text-slate-900 md:text-6xl">
            Ihre Google-Maps-Sichtbarkeit liegt aktuell hinter Ihrer Konkurrenz.
          </h1>

          <p className="mb-12 text-center text-xl text-slate-600">
            Analyse fuer &bdquo;{keyword}&ldquo; im Umkreis Ihres Standorts in {location}.
          </p>

          {isLoading && <LoadingState />}

          {!isLoading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <h2 className="text-2xl font-semibold text-rose-800">Analyse konnte nicht geladen werden</h2>
              <p className="mt-3 text-rose-700">{error}</p>
              {errorJson && (
                <pre className="mt-4 overflow-x-auto rounded-xl border border-rose-200 bg-white p-4 text-left text-xs leading-5 text-slate-700">
                  {errorJson}
                </pre>
              )}
              <button
                type="button"
                onClick={() => void runAnalysis()}
                className="mt-6 rounded-lg bg-rose-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-rose-700"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!isLoading && !error && !result && selectionMatches.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Bitte Unternehmen auswaehlen</h2>
              <p className="mt-2 text-slate-600">{selectionMessage}</p>
              <div className="mt-6 grid gap-3">
                {selectionMatches.map((match) => (
                  <button
                    key={match.reportKey}
                    type="button"
                    onClick={() => void runAnalysis(match.reportKey)}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <p className="font-semibold text-slate-900">{match.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{match.address}</p>
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Letzter Report: {formatReportDate(match.date, match.timestamp)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && result && (
            <div className="grid gap-6 md:grid-cols-3">
              {kpis.map((kpi, index) => (
                <div
                  key={kpi.label}
                  className={`rounded-2xl border-2 p-8 text-center ${kpi.bgColor} ${kpi.borderColor} ${
                    index === 0 ? "shadow-lg" : ""
                  }`}
                >
                  <div className={`mb-3 text-5xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{kpi.label}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{kpi.subtext}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {!isLoading && !error && result && (
          <>
            <section className="mx-auto mb-16 w-full max-w-5xl px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-start gap-3">
                  <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-orange-600" />
                  <div>
                    <h2 className="mb-2 text-3xl font-bold text-slate-900">
                      Wo Sie aktuell Sichtbarkeit verlieren
                    </h2>
                    <p className="mb-2 text-lg text-slate-600">
                      In mehreren Bereichen erscheint Ihr Unternehmen nicht konstant unter den
                      Top-3-Ergebnissen.
                    </p>
                    <p className="text-base text-slate-600">
                      Patienten entscheiden sich in diesen Bereichen haeufiger fuer Wettbewerber.
                    </p>
                  </div>
                </div>

                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200">
                    <Image
                      src={heatmapSource}
                      alt="Local-Falcon Heatmap"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      Top 3
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-yellow-500" />
                      Top 10
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                      Ab 11
                    </span>
                  </div>
                </div>

                <p className="mb-2 text-center text-lg font-medium text-slate-700">
                  Wenn Sie nicht unter den Top-3 erscheinen, werden Sie haeufig nicht angeklickt.
                </p>
              </div>
            </section>

            <section className="mx-auto mb-16 w-full max-w-5xl px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-start gap-3">
                  <Users className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
                  <h2 className="text-3xl font-bold text-slate-900">
                    Ranking-Verteilung in Ihrem Suchgebiet
                  </h2>
                </div>

                <div className="mb-6">
                  <SegmentBars segments={distributionSegments} />
                </div>

                <p className="mb-2 text-lg leading-relaxed text-slate-700">
                  Match-Typ der Reportzuordnung: {getMatchTypeLabel(result.selection.matchType)}.
                </p>
                <p className="text-sm text-slate-600">
                  Ausgewerteter Report: {result.report.key ?? "-"} | Datenpunkte: {result.metrics.points}
                </p>
              </div>
            </section>

            <section className="mx-auto mb-16 w-full max-w-5xl px-6">
              <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-sm">
                <div className="mb-6 flex items-start gap-3">
                  <Star className="mt-1 h-6 w-6 shrink-0 fill-emerald-600 text-emerald-600" />
                  <h2 className="text-3xl font-bold text-slate-900">
                    Ihr Profil und Ihre Bewertungen als Hebel
                  </h2>
                </div>

                <div className="mb-6 flex items-center gap-8">
                  <div className="text-center">
                    <div className="mb-2 flex items-center gap-2">
                      <Star className="h-8 w-8 fill-yellow-500 text-yellow-500" />
                      <span className="text-5xl font-bold text-slate-900">
                        {result.business.rating !== null ? result.business.rating.toFixed(1) : "-"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Bewertung</p>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-5xl font-bold text-slate-900">
                      {result.business.reviews ?? "-"}
                    </div>
                    <p className="text-sm text-slate-600">Rezensionen</p>
                  </div>
                </div>

                <p className="text-lg leading-relaxed text-emerald-900">
                  Profil: {result.business.name}. Adresse: {result.business.address}.
                </p>
                {result.business.website && (
                  <a
                    href={result.business.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Website aufrufen
                  </a>
                )}
              </div>
            </section>

            <section className="mx-auto mb-16 w-full max-w-5xl px-6">
              <div className="rounded-2xl bg-emerald-600 p-10 text-white shadow-xl">
                <h2 className="mb-2 text-center text-4xl font-bold">So ueberholen Sie Ihre Konkurrenz</h2>
                <p className="mb-8 text-center text-emerald-100">
                  Die Umsetzung erfolgt datenbasiert und kontinuierlich.
                </p>
                <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-6 w-6 shrink-0" />
                    <span className="text-lg">Regionale Staerkung schwacher Gebiete</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-6 w-6 shrink-0" />
                    <span className="text-lg">Strategische Ueberholung direkter Wettbewerber</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-6 w-6 shrink-0" />
                    <span className="text-lg">Optimierung Ihres Google Business Profils</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-6 w-6 shrink-0" />
                    <span className="text-lg">Nachhaltige Stabilisierung Ihrer Top-3-Positionen</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto w-full max-w-5xl px-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-center shadow-2xl">
                <p className="mt-2 mb-8 text-base font-semibold text-emerald-400">
                  Ihre Analyse zeigt klares Optimierungspotenzial.
                </p>

                <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                  Bereit, Ihre Konkurrenz in Google Maps zu ueberholen?
                </h2>
                <p className="mb-10 text-xl text-slate-300">
                  Waehlen Sie das passende Optimierungs-Paket fuer Ihren Standort.
                </p>

                <Link
                  href="/#start"
                  className="inline-flex transform items-center gap-3 rounded-xl bg-emerald-600 px-12 py-6 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-500/40"
                >
                  Jetzt Optimierungs-Paket auswaehlen
                  <ArrowRight className="h-6 w-6" />
                </Link>

                <div className="mt-8 space-y-3">
                  <p className="text-sm text-slate-400">Keine Vertragslaufzeit. Keine versteckten Kosten.</p>
                  <div className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm text-slate-400">Bereits ueber 500 Standorte erfolgreich optimiert.</p>
                  </div>
                </div>

                {(result.report.publicUrl || result.report.pdf) && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
                    {result.report.publicUrl && (
                      <a
                        href={result.report.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-300 hover:text-emerald-200"
                      >
                        Original-Report ansehen
                      </a>
                    )}
                    {result.report.pdf && (
                      <a
                        href={result.report.pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-300 hover:text-emerald-200"
                      >
                        PDF herunterladen
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
