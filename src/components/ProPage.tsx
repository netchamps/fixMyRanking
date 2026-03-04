import Link from "next/link";
import { Check, ChevronDown, Shield } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

type PackageKey = "bronze" | "silver" | "gold";

type ProPageProps = {
  initialPackage?: PackageKey;
  location?: string;
  keyword?: string;
  businessName?: string;
};

type PackageCard = {
  packageKey: PackageKey;
  title: string;
  subtitle: string;
  subline?: string;
  priceMain: string;
  priceMonthly?: string;
  priceSecondary?: string;
  priceDetail?: string;
  microcopy?: string;
  features: string[];
  recommended: boolean;
  borderClass: string;
  borderHoverClass: string;
  checkClass: string;
  buttonClass: string;
  shadowClass?: string;
  scaleClass?: string;
};

const packageCards: PackageCard[] = [
  {
    packageKey: "bronze",
    title: "KundenRadar24 Pro - Bronze",
    subtitle: "Maximale Flexibilität",
    subline: "Ideal für kleinere Standorte oder als erste Optimierungsphase.",
    priceMain: "98 EUR exkl. MwSt.",
    priceMonthly: "/ Monat",
    priceSecondary: "Monatlich kündbar",
    features: [
      "Laufende Local-SEO-Optimierung",
      "Optimierung des Google Business Profils",
      "Verbesserung lokaler Relevanzsignale",
      "Google Bewertungsmanagement",
      "Regelmäßige Standort-Analyse",
      "Monatlich kündbar",
    ],
    recommended: false,
    borderClass: "border-amber-700",
    borderHoverClass: "hover:border-amber-800",
    checkClass: "text-amber-700",
    buttonClass: "bg-amber-700 text-white hover:bg-amber-800",
  },
  {
    packageKey: "silver",
    title: "KundenRadar24 Pro - Silber",
    subtitle: "Für messbare Verbesserungen",
    priceMain: "269 EUR exkl. MwSt.",
    priceSecondary: "Laufzeit: 3 Monate",
    priceDetail: "entspricht 89,66 EUR exkl. MwSt. / Monat",
    microcopy: "Empfohlen für die meisten Standorte",
    features: [
      "Alle Leistungen aus KundenRadar24 Pro - Bronze",
      "Kontinuierliche Optimierung über 3 Monate",
      "Mehr Stabilität für lokale Rankings",
      "Nachhaltiger Aufbau lokaler Sichtbarkeit",
      "Fester Optimierungszeitraum",
    ],
    recommended: true,
    borderClass: "border-slate-400",
    borderHoverClass: "hover:border-slate-500",
    checkClass: "text-slate-500",
    buttonClass: "bg-slate-600 text-white hover:bg-slate-700",
    shadowClass: "shadow-xl shadow-slate-400/30",
    scaleClass: "md:scale-105",
  },
  {
    packageKey: "gold",
    title: "KundenRadar24 Pro - Gold",
    subtitle: "Langfristige Sichtbarkeit & Stabilität",
    priceMain: "979 EUR exkl. MwSt.",
    priceSecondary: "Laufzeit: 12 Monate",
    priceDetail: "entspricht 81,58 EUR exkl. MwSt. / Monat",
    features: [
      "Alle Leistungen aus KundenRadar24 Pro - Silber",
      "Langfristiger Aufbau lokaler Autorität",
      "Stabilere Top-Positionen in Google Maps",
      "Laufende Anpassung an Wettbewerb & Markt",
      "Priorisierte Optimierung",
    ],
    recommended: false,
    borderClass: "border-yellow-600",
    borderHoverClass: "hover:border-yellow-700",
    checkClass: "text-yellow-600",
    buttonClass: "bg-yellow-600 text-white hover:bg-yellow-700",
  },
];

const benefits = [
  "Gezielte Google-Maps-Optimierung",
  "Standortbasierte Ranking-Analyse",
  "Aktive Optimierung statt reiner Auswertung",
  "Google Bewertungsmanagement",
  "Nachhaltige, Google-konforme Maßnahmen",
  "Kein Kostenrisiko bei Bewertungen",
  "Persönlicher Support bei Fragen",
  "DSGVO-konforme Optimierung",
];

const trustPoints = [
  "Keine Vertragslaufzeit beim Monatsabo",
  "Keine versteckten Kosten",
  "Google-konforme Optimierung",
  "Ergebnisse entwickeln sich schrittweise",
];

const faqs = [
  {
    question: "Warum sind mehrere Monate sinnvoll?",
    answer:
      "Lokale Rankings bauen sich schrittweise auf. Eine kontinuierliche Optimierung über mehrere Monate erhöht Stabilität und Nachhaltigkeit der Ergebnisse.",
  },
  {
    question: "Wie funktioniert die Kündigung?",
    answer:
      "Das Bronze-Paket ist monatlich kündbar. Silber- und Gold-Pakete laufen über den gebuchten Zeitraum und können vor Ablauf der Laufzeit gekündigt werden, um eine automatische Verlängerung zu verhindern.",
  },
  {
    question: "Gibt es Einrichtungsgebühren?",
    answer:
      "Nein. Es fallen keine Einrichtungsgebühren an. Sie zahlen ausschließlich die im Paket angegebenen Preise.",
  },
  {
    question: "Kann ich mein Paket während der Laufzeit upgraden?",
    answer: "Ja, ein Upgrade ist jederzeit möglich. Sprechen Sie uns dazu einfach an.",
  },
  {
    question: "Wie läuft der Start nach Buchung ab?",
    answer:
      "Nach der Buchung erhalten Sie eine Bestätigung und alle nötigen Informationen zum weiteren Ablauf. Die Optimierung beginnt innerhalb weniger Werktage.",
  },
  {
    question: "Wann sehe ich erste Ergebnisse?",
    answer:
      "Erste Verbesserungen können - abhängig von Ausgangslage und Wettbewerb - häufig nach etwa 30 Tagen sichtbar werden.",
  },
  {
    question: "Ist KundenRadar24 Pro für jeden Standort sinnvoll?",
    answer:
      "KundenRadar24 Pro eignet sich für alle lokal tätigen Unternehmen, die über Google Maps neue Kunden gewinnen möchten.",
  },
];

function buildCheckoutHref({
  packageKey,
  location,
  keyword,
  businessName,
}: {
  packageKey: PackageKey;
  location: string;
  keyword: string;
  businessName: string;
}) {
  const params = new URLSearchParams();
  params.set("package", packageKey);

  if (location) {
    params.set("location", location);
  }

  if (keyword) {
    params.set("keyword", keyword);
  }

  if (businessName) {
    params.set("businessName", businessName);
  }

  return `/checkout${params.size > 0 ? `?${params.toString()}` : ""}`;
}

export function ProPage({
  initialPackage = "silver",
  location = "",
  keyword = "",
  businessName = "",
}: ProPageProps) {
  const defaultCheckoutHref = buildCheckoutHref({
    packageKey: initialPackage,
    location,
    keyword,
    businessName,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <div className="pt-24 pb-16">
        <section className="mx-auto mb-16 w-full max-w-5xl px-6 text-center">
          <h1 className="mb-4 text-3xl font-bold text-slate-900 md:text-5xl">
            Wählen Sie das passende Optimierungspaket für Ihren Standort.
          </h1>
          <p className="mb-4 text-xs text-slate-400">
            Bereits von 500+ lokalen Unternehmen in ganz Deutschland genutzt
          </p>
          <p className="text-lg text-slate-600">
            Unsere Pakete unterscheiden sich im Umfang und Optimierungszeitraum -
            alle Maßnahmen erfolgen datenbasiert, transparent und strukturiert.
          </p>
        </section>

        <section className="mx-auto mb-20 w-full max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {packageCards.map((pkg) => {
              const checkoutHref = buildCheckoutHref({
                packageKey: pkg.packageKey,
                location,
                keyword,
                businessName,
              });

              return (
                <article
                  key={pkg.packageKey}
                  className={`relative flex flex-col rounded-xl border-2 bg-white p-8 shadow-sm transition-all ${pkg.borderClass} ${pkg.borderHoverClass} ${pkg.shadowClass ?? ""} ${pkg.scaleClass ?? ""}`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                        Empfohlen
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h2 className="mb-2 text-2xl leading-tight font-bold text-slate-900 md:text-3xl">
                      {pkg.title}
                    </h2>
                    <p className="mb-4 text-sm text-slate-600">{pkg.subtitle}</p>

                    {pkg.subline && (
                      <p className="mb-4 text-sm italic text-slate-500">{pkg.subline}</p>
                    )}

                    <p className="text-4xl leading-none font-bold text-slate-900">
                      {pkg.priceMain}
                    </p>
                    {pkg.priceMonthly && (
                      <p className="mt-1 text-xs text-slate-500">{pkg.priceMonthly}</p>
                    )}
                    {pkg.priceSecondary && (
                      <p className="mt-1 text-xs text-slate-500">{pkg.priceSecondary}</p>
                    )}
                    {pkg.priceDetail && (
                      <p className="mt-1 text-xs text-slate-500">{pkg.priceDetail}</p>
                    )}
                    {pkg.microcopy && (
                      <p className="mt-2 text-xs italic text-slate-400">{pkg.microcopy}</p>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-5 w-5 shrink-0 ${pkg.checkClass}`} />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={checkoutHref}
                    className={`inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition-all ${pkg.buttonClass}`}
                  >
                    Jetzt optimieren
                  </Link>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Automatische Verlängerung nach Ablauf, sofern nicht
                    fristgerecht gekündigt.
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mb-16 w-full max-w-4xl px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            Was ist in KundenRadar24 Pro enthalten?
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <ul className="grid gap-6 md:grid-cols-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto mb-16 w-full max-w-4xl px-6">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
            <ul className="grid gap-4 md:grid-cols-2">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-sm text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto mb-16 w-full max-w-4xl px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            Häufige Fragen zu KundenRadar24 Pro
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 hover:bg-slate-50">
                  <span className="pr-4 font-semibold text-slate-900">{faq.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5">
                  <p className="leading-relaxed text-slate-600">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-12 w-full max-w-4xl px-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-12 text-center text-white shadow-xl">
            <h2 className="mb-6 text-2xl font-bold md:text-4xl">
              Bereit, Ihre Google-Maps-Sichtbarkeit nachhaltig zu verbessern?
            </h2>
            <Link
              href={defaultCheckoutHref}
              className="inline-flex transform items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-emerald-600 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl"
            >
              Optimierung für meinen Standort starten
            </Link>
            <p className="mt-6 text-sm text-emerald-100">
              Transparente Laufzeiten. Klare Paketstruktur.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6 text-center">
          <p className="text-xs leading-relaxed text-slate-400">
            Ergebnisse können je nach Branche, Standort, Wettbewerb und
            Ausgangssituation variieren. Verbesserungen erfolgen schrittweise und
            setzen kontinuierliche Optimierung voraus.
          </p>
          <p className="mt-16 text-sm text-slate-400">
            Keine Vertragslaufzeit - Keine versteckten Kosten
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
