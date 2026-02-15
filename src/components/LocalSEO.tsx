import { BarChart3, CheckCircle2, MapPinned } from "lucide-react";

const points = [
  {
    title: "Lokale Suchintention",
    text: "Ein grosser Teil aller Suchanfragen hat lokalen Bezug. Genau dort setzen wir an.",
  },
  {
    title: "Hohe Kaufbereitschaft",
    text: "Nutzer auf Google Maps suchen meist nach einer direkten Losung in ihrer Nahe.",
  },
  {
    title: "Messbare Entwicklung",
    text: "Sie sehen transparent, wie sich Sichtbarkeit, Klicks und Anfragen entwickeln.",
  },
];

const steps = [
  "Ausgangsanalyse Ihrer Position in relevanten Suchgebieten",
  "Priorisierung der wichtigsten Hebel fuer Ihr Profil",
  "Laufende Optimierung von Relevanz, Vertrauen und Sichtbarkeit",
  "Kontinuierliches Monitoring mit klarer Fortschrittsmessung",
];

export function LocalSEO() {
  return (
    <section id="local-seo" className="mx-auto w-full max-w-7xl px-6 py-20">
      <div className="mb-14 text-center">
        <span className="mb-4 inline-block rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          Warum Local SEO
        </span>
        <h2 className="mb-4 text-4xl font-bold text-slate-900">Warum lokale Sichtbarkeit heute entscheidend ist</h2>
        <p className="mx-auto max-w-3xl text-xl text-slate-600">
          Wer auf Google Maps nicht sichtbar ist, wird von potenziellen Kunden oft gar nicht gefunden.
        </p>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-3">
        {points.map((point, index) => (
          <article key={point.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
              {index === 0 && <MapPinned className="h-5 w-5 text-slate-700" />}
              {index === 1 && <CheckCircle2 className="h-5 w-5 text-slate-700" />}
              {index === 2 && <BarChart3 className="h-5 w-5 text-slate-700" />}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{point.title}</h3>
            <p className="text-slate-600">{point.text}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-2xl font-bold text-slate-900">Unser Vorgehen in 4 klaren Schritten</h3>
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-slate-700">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
