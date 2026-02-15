import {
  Clock,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Target,
    title: "Präzise Standortanalyse",
    description:
      "Wir analysieren Ihre Google-Maps-Position aus hunderten realer Standpunkte rund um Ihren Standort.",
  },
  {
    icon: TrendingUp,
    title: "Aktive Optimierung",
    description:
      "Wir optimieren Ihr Google Business Profil und lokale Ranking-Signale gezielt und datenbasiert.",
  },
  {
    icon: Clock,
    title: "Ergebnisse nach ca. 30 Tagen",
    description:
      "Erste sichtbare Verbesserungen in den lokalen Rankings sind häufig nach etwa 30 Tagen erkennbar.",
  },
  {
    icon: Star,
    title: "Bewertungsmanagement",
    description:
      "Wir unterstutzen Sie beim Umgang mit negativen Google-Bewertungen strukturiert und professionell.",
  },
  {
    icon: Shield,
    title: "Google-konform",
    description:
      "Alle Massnahmen entsprechen den Google-Richtlinien fuer nachhaltige und sichere Rankings.",
  },
  {
    icon: Users,
    title: "Mehr Anfragen",
    description:
      "Verbesserte Sichtbarkeit fuhrt zu mehr Klicks, Anrufen und qualifizierten Kundenanfragen.",
  },
];

export function Features() {
  return (
    <section
      id="leistungen"
      className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 py-20">
      <div className="mb-16 text-center">
        <span className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          Leistungen
        </span>
        <h2 className="mb-4 text-4xl font-bold text-slate-900">
          Analyse ist der Start. Optimierung bringt die Ergebnisse.
        </h2>
        <p className="mx-auto max-w-3xl text-xl text-slate-600">
          Wir kombinieren prazise Datenanalyse mit aktiver Optimierung fuer
          messbare Erfolge.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:border-emerald-300 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <feature.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              {feature.title}
            </h3>
            <p className="leading-relaxed text-slate-600">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
