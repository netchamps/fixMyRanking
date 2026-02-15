"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Lock,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import type { PreselectedLocation } from "@/types/preselected-location";

type AnalysisResultPageProps = {
  location: string;
  keyword: string;
  selectedLocation: PreselectedLocation | null;
};

type CompetitorRow = {
  name: string;
  value: number;
  isOwnBusiness?: boolean;
};

const competitorData: CompetitorRow[] = [
  { name: "Ihr Unternehmen", value: 43, isOwnBusiness: true },
  { name: "Wettbewerber A", value: 87 },
  { name: "Wettbewerber B", value: 79 },
];

const trustElements = [
  { icon: Shield, text: "DSGVO-konform" },
  { icon: Lock, text: "Keine Vertragsbindung" },
  { icon: Check, text: "Transparente Optimierung" },
];

function VisibilityRing() {
  const percent = 43;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="#ef4444"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-900">
        {percent}%
      </div>
    </div>
  );
}

function CompetitorBars() {
  return (
    <div className="space-y-3">
      {competitorData.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.name}</span>
            <span className="font-semibold text-slate-900">{item.value}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                item.isOwnBusiness ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalysisResultPage({
  location,
  keyword,
  selectedLocation,
}: AnalysisResultPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    privacy: false,
  });
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      return;
    }

    setShowAnalysis(true);
    const params = new URLSearchParams();
    if (location.trim().length > 0) {
      params.set("location", location.trim());
    }
    if (keyword.trim().length > 0) {
      params.set("keyword", keyword.trim());
    }
    if (selectedLocation) {
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

  const analysisContext =
    location && keyword
      ? `Analyse fuer \"${keyword}\" in ${location}`
      : "Individuelle Standort-Analyse";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="pb-16">
        <section className="mx-auto w-full max-w-5xl px-6 pt-28 pb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900 md:text-5xl">
            Ihre Google-Maps-Analyse ist fast bereit.
          </h1>
          <p className="mb-3 text-xl text-slate-600">
            Geben Sie Ihre Kontaktdaten ein und erhalten Sie sofort Ihre individuelle
            Standort-Analyse.
          </p>
          <p className="text-sm font-medium text-emerald-600">100 % kostenlos. Keine Verpflichtung.</p>
          <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            {analysisContext}
          </p>
        </section>

        <section className="mx-auto mb-16 w-full max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div
              className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-500 ${
                showAnalysis ? "md:sticky md:top-24 md:h-fit" : ""
              }`}>
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Analyse freischalten</h2>

              {!showAnalysis && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Sie sind nur einen Schritt von Ihrer persoenlichen Analyse entfernt.</p>
                </div>
              )}

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
                    Wir senden Ihnen Ihre Analyse zusaetzlich bequem per WhatsApp zu.
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
                      Datenschutzerklaerung
                    </a>{" "}
                    zu.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full rounded-lg px-6 py-4 font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${
                    isFormValid
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

            <div
              id="analysis-preview"
              className={`transition-all duration-700 ${showAnalysis ? "opacity-100" : "opacity-95"}`}>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <div className="mb-6 flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Ihre aktuelle Google-Maps-Performance
                  </h2>
                  {!showAnalysis && <Lock className="h-5 w-5 text-slate-400" />}
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Sichtbarkeits-Score
                    </h3>
                    <div className="flex items-center gap-6">
                      <VisibilityRing />
                      <div className="flex-1 text-slate-700">
                        Ihr Standort erscheint aktuell nur in <strong>43 %</strong> der relevanten
                        Suchanfragen.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      Ranking-Heatmap
                    </h3>
                    <div className="relative overflow-hidden rounded-lg border border-slate-100">
                      <div className={`relative aspect-video w-full ${!showAnalysis ? "blur-[2px]" : ""}`}>
                        <Image
                          src="/assets/figma/before-ranking.png"
                          alt="Ranking Heatmap Vorschau"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                      {!showAnalysis && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20">
                          <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700">
                            Vorschau gesperrt
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      In vielen Stadtbereichen sind Sie nicht unter den Top-3 sichtbar.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Users className="h-5 w-5 text-emerald-600" />
                      Wettbewerbsvergleich
                    </h3>
                    <CompetitorBars />
                    <p className="mt-4 text-sm text-slate-600">
                      <strong>2 direkte Wettbewerber</strong> dominieren die lokale Suche.
                    </p>
                  </div>

                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                    <p className="text-center font-medium text-emerald-900">
                      <TrendingUp className="mr-2 inline h-5 w-5" />
                      Durch gezielte Optimierung kann Ihre Sichtbarkeit um{" "}
                      <strong className="text-emerald-700">30-70 %</strong> gesteigert werden.
                    </p>
                  </div>
                </div>
              </div>

              {showAnalysis && (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-xl">
                  <h3 className="mb-3 text-2xl font-bold">
                    Moechten Sie diese Ergebnisse nachhaltig verbessern?
                  </h3>
                  <p className="mb-6 text-emerald-50">
                    Auf Basis Ihrer Analyse entwickeln wir eine individuelle Optimierungsstrategie fuer
                    Ihren Standort.
                  </p>
                  <Link
                    href="/#start"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-semibold text-emerald-600 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl">
                    Optimierungs-Optionen ansehen
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              )}
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
