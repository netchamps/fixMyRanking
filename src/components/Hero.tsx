"use client";

import { Check, Loader2, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PreselectedLocation } from "@/types/preselected-location";

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

export function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [matches, setMatches] = useState<PreselectedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PreselectedLocation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const canSearch = location.trim().length >= 3;
  const canSubmit = keyword.trim().length > 0 && selectedLocation !== null && !isSearching;

  const handleLocationSearch = async () => {
    if (!canSearch) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSelectedLocation(null);

    try {
      const response = await fetch("/api/local-falcon/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: location.trim(),
          keyword: keyword.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as SearchApiResponse | null;

      if (!payload || !response.ok || payload.success === false) {
        const message =
          payload && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Standortsuche ist fehlgeschlagen.";
        setMatches([]);
        setSearchError(message);
        return;
      }

      setMatches(payload.results);

      if (payload.results.length === 0) {
        setSearchError(
          "Keine passenden Standorte gefunden. Bitte Firmenname und Stadt pruefen.",
        );
      }
    } catch (error) {
      setMatches([]);
      setSearchError(
        error instanceof Error ? error.message : "Standortsuche ist fehlgeschlagen.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const params = new URLSearchParams();
    params.set(
      "location",
      `${selectedLocation.name}${selectedLocation.address ? `, ${selectedLocation.address}` : ""}`,
    );
    params.set("keyword", keyword.trim());
    params.set("placeId", selectedLocation.placeId);
    params.set("lat", selectedLocation.lat.toString());
    params.set("lng", selectedLocation.lng.toString());
    params.set("businessName", selectedLocation.name);
    params.set("businessAddress", selectedLocation.address);

    if (selectedLocation.rating !== null) {
      params.set("businessRating", selectedLocation.rating.toString());
    }

    if (selectedLocation.reviews !== null) {
      params.set("businessReviews", selectedLocation.reviews.toString());
    }

    if (selectedLocation.phone) {
      params.set("businessPhone", selectedLocation.phone);
    }

    if (selectedLocation.website) {
      params.set("businessUrl", selectedLocation.website);
    }

    router.push(`/analyse?${params.toString()}`);
  };

  const handleLocationChange = (nextValue: string) => {
    setLocation(nextValue);
    setSelectedLocation(null);
    setMatches([]);
    setSearchError(null);
  };

  const handleSelectLocation = (match: PreselectedLocation) => {
    setSelectedLocation(match);
    setLocation(`${match.name}${match.address ? `, ${match.address}` : ""}`);
    setSearchError(null);
  };

  return (
    <section
      id="hero"
      className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 pt-10 pb-24">
      <div className="mb-10 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900 md:text-2xl">
            LocalRank Pro
          </span>
        </div>
      </div>

      <div className="mx-auto mb-12 max-w-5xl text-center">
        <h1 className="mb-6 text-5xl leading-[1.1] font-bold text-slate-900 md:text-7xl">
          Mehr Sichtbarkeit bei Google Maps.
          <br />
          Mehr Anfragen aus Ihrer Region.
        </h1>
        <p className="mb-12 text-2xl leading-relaxed text-slate-600">
          Transparente Analyse. Strukturierte Optimierung. Messbare lokale
          Praesenz.
        </p>

        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <label
                  htmlFor="location"
                  className="mb-2 block text-left text-sm font-semibold text-slate-700">
                  Standort
                </label>
                <div className="relative">
                  <MapPin className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(event) => handleLocationChange(event.target.value)}
                    placeholder="z.B. Firmenname + Stadt"
                    className="w-full rounded-lg border border-slate-200 py-3.5 pr-4 pl-12 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="keyword"
                  className="mb-2 block text-left text-sm font-semibold text-slate-700">
                  Keyword
                </label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="keyword"
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="z.B. Restaurant"
                    className="w-full rounded-lg border border-slate-200 py-3.5 pr-4 pl-12 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void handleLocationSearch()}
                disabled={!canSearch || isSearching}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60">
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Standortsuche...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Standort suchen
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500">
                Bitte zuerst Standort suchen und Ihr Unternehmen auswaehlen.
              </p>
            </div>

            {searchError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {searchError}
              </div>
            )}

            {selectedLocation && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800">
                Ausgewaehlt: <span className="font-semibold">{selectedLocation.name}</span>{" "}
                <span className="text-emerald-700">({selectedLocation.address})</span>
              </div>
            )}

            {matches.length > 0 && (
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                {matches.map((match) => (
                  <button
                    key={match.placeId}
                    type="button"
                    onClick={() => handleSelectLocation(match)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedLocation?.placeId === match.placeId
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                    }`}>
                    <p className="text-sm font-semibold text-slate-900">{match.name}</p>
                    <p className="mt-1 text-xs text-slate-600">{match.address}</p>
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
              Kostenlose Analyse starten
            </button>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>100 % unverbindliche Analyse</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Keine Verpflichtung</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>DSGVO-konform</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
