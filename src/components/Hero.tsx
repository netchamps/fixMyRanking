"use client";

import { Check, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");

  const canSubmit = location.trim().length >= 3 && keyword.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const params = new URLSearchParams();
    params.set("location", location.trim());
    params.set("keyword", keyword.trim());

    router.push(`/analyse?${params.toString()}`);
  };

  return (
    <section
      id="hero"
      className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 pt-10 pb-24">
      
      <div className="mx-auto mb-12 max-w-5xl text-center">
        <h1 className="mb-6 text-5xl leading-[1.1] font-bold text-slate-900 md:text-7xl">
          Mehr Sichtbarkeit bei Google Maps.
          <br />
          Mehr Anfragen aus Ihrer Region.
        </h1>
        <p className="mb-12 text-2xl leading-relaxed text-slate-600">
          Transparente Analyse. Strukturierte Optimierung. Messbare lokale
          Präsenz.
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
                    onChange={(event) => setLocation(event.target.value)}
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
