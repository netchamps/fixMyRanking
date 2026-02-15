import { ArrowRight } from "lucide-react";
import Image from "next/image";

function MapView({ src, title }: { src: string; title: string }) {
  return (
    <div className="flex-1">
      <h3 className="mb-4 text-center text-lg font-semibold text-slate-900">
        {title}
      </h3>
      <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-lg">
          <Image src={src} alt={title} fill className="object-cover" />
        </div>
      </div>
    </div>
  );
}

export function RankingVisualization() {
  return (
    <section
      id="beispiel"
      className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 py-20">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-block rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          Sichtbarkeits-Analyse
        </span>
        <h2 className="mb-4 text-4xl font-bold text-slate-900">
          So verändert sich Ihre lokale Sichtbarkeit
        </h2>
        <p className="mx-auto max-w-3xl text-xl text-slate-600">
          Rot markiert geringe Praesenz. Gruen zeigt stabile Ranking-Zonen im
          relevanten Umkreis.
        </p>
      </div>

      <div className="mb-12 flex flex-col items-center gap-8 lg:flex-row">
        <MapView
          src="/assets/figma/before-ranking.png"
          title="Vor der Optimierung"
        />

        <div className="shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">
            <ArrowRight className="h-6 w-6 text-white" />
          </div>
        </div>

        <MapView
          src="/assets/figma/after-ranking.png"
          title="Nach der Optimierung"
        />
      </div>

      <div className="mb-12 text-center">
        <p className="mx-auto max-w-3xl text-sm text-slate-500">
          Beispielhafte Darstellung eines Kundenprojekts.
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-700">Top 3 Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-700">Top 10 Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-rose-500" />
            <span className="text-sm text-slate-700">Position 20+</span>
          </div>
        </div>
      </div>

      <div id="ergebnisse" className="mt-16 mb-8 scroll-mt-28 text-center">
        <h3 className="text-2xl font-bold text-slate-900">
          Was unsere Optimierung bewirken kann
        </h3>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-3xl font-bold text-emerald-600">+347%</div>
          <div className="text-slate-600">
            Steigerung der lokalen Sichtbarkeit
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-3xl font-bold text-emerald-600">83%</div>
          <div className="text-slate-600">Rankings in den Top 3</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-3xl font-bold text-emerald-600">+412%</div>
          <div className="text-slate-600">Mehr Anfragen ueber Google Maps</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-3xl font-bold text-emerald-600">
            ~30 Tage
          </div>
          <div className="text-slate-600">
            Ø Zeit bis zu ersten Verbesserungen
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="mx-auto max-w-3xl text-xs leading-relaxed text-slate-500">
          Die dargestellten Kennzahlen basieren auf ausgewählten
          Kundenprojekten. Ergebnisse koennen je nach Branche, Standort,
          Wettbewerb und Ausgangssituation variieren. Verbesserungen erfolgen
          schrittweise und setzen kontinuierliche Optimierung voraus.
        </p>
      </div>
    </section>
  );
}
