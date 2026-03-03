"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Shield,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import {
  checkoutPackageData,
  type BillingFormData,
  type CheckoutPackage,
  type CheckoutPackageConfig,
  type CheckoutPaymentMethod,
} from "@/lib/checkout-config";

type CheckoutPageProps = {
  initialPackage?: CheckoutPackage;
  location?: string;
  keyword?: string;
  businessName?: string;
};

type CheckoutCheckboxes = {
  agb: boolean;
  business: boolean;
  immediate: boolean;
};

type PersistedCheckoutState = {
  formData: BillingFormData;
  paymentMethod: CheckoutPaymentMethod;
  checkboxes: CheckoutCheckboxes;
};

const CHECKOUT_STATE_STORAGE_KEY = "checkout_state_v1";

const defaultCheckboxes: CheckoutCheckboxes = {
  agb: false,
  business: false,
  immediate: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidPersistedCheckoutState(value: unknown): value is PersistedCheckoutState {
  if (!isRecord(value)) {
    return false;
  }

  const paymentMethod = value.paymentMethod;
  const formData = value.formData;
  const checkboxes = value.checkboxes;

  if (
    paymentMethod !== "paypal" &&
    paymentMethod !== "card" &&
    paymentMethod !== "sepa"
  ) {
    return false;
  }

  if (!isRecord(formData) || !isRecord(checkboxes)) {
    return false;
  }

  return (
    typeof formData.company === "string" &&
    typeof formData.contact === "string" &&
    typeof formData.street === "string" &&
    typeof formData.zip === "string" &&
    typeof formData.city === "string" &&
    typeof formData.country === "string" &&
    typeof formData.email === "string" &&
    typeof formData.phone === "string" &&
    typeof formData.vatId === "string" &&
    typeof checkboxes.agb === "boolean" &&
    typeof checkboxes.business === "boolean" &&
    typeof checkboxes.immediate === "boolean"
  );
}

const summaryBenefits = [
  "Laufende Bewertungsoptimierung",
  "Strategisches Bewertungsmanagement",
  "Monitoring & Analyse",
  "Reporting & Performance-Tracking",
  "DSGVO-konform",
  "Persönlicher Ansprechpartner",
  "Individuelle Anpassung je Standort",
  "Wettbewerbsanalyse & Marktbeobachtung",
];

const trustPoints = [
  { icon: Lock, text: "SSL-verschlüsselte Datenübertragung" },
  { icon: Shield, text: "DSGVO-konform" },
  { icon: Check, text: "Keine versteckten Kosten" },
  { icon: Check, text: "Transparente Vertragsbedingungen" },
  { icon: Shield, text: "Sichere Zahlungsabwicklung" },
  { icon: Phone, text: "Persönlicher Support erreichbar" },
];

const faqs = [
  {
    question: "Wann startet die Optimierung?",
    answer: "Unmittelbar nach Zahlungseingang.",
  },
  {
    question: "Wie kann ich kündigen?",
    answer: "Schriftlich per E-Mail bis 30 Tage vor Laufzeitende.",
  },
  {
    question: "Gibt es eine Mindestlaufzeit?",
    answer: "Entsprechend dem gewählten Paket (1, 3 oder 12 Monate).",
  },
  {
    question: "Erhalte ich eine Rechnung?",
    answer: "Ja, automatisch per E-Mail.",
  },
];

export function CheckoutPage({
  initialPackage = "silver",
  location = "",
  keyword = "",
  businessName = "",
}: CheckoutPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("paypal");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasRestoredCheckoutState, setHasRestoredCheckoutState] = useState(false);
  const [formData, setFormData] = useState<BillingFormData>({
    company: businessName,
    contact: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
    vatId: "",
  });
  const [checkboxes, setCheckboxes] = useState<CheckoutCheckboxes>(defaultCheckboxes);

  const packageConfig = checkoutPackageData[initialPackage];

  const isFormValid = useMemo(() => {
    return Boolean(
      formData.company.trim() &&
        formData.contact.trim() &&
        formData.street.trim() &&
        formData.zip.trim() &&
        formData.city.trim() &&
        formData.country.trim() &&
        formData.email.trim() &&
        formData.phone.trim() &&
        checkboxes.agb &&
        checkboxes.business,
    );
  }, [checkboxes, formData]);

  const handleInputChange = (field: keyof BillingFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleCheckboxChange = (
    field: keyof typeof checkboxes,
    value: boolean,
  ) => {
    setCheckboxes((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    try {
      const rawState = window.sessionStorage.getItem(CHECKOUT_STATE_STORAGE_KEY);

      if (!rawState) {
        return;
      }

      const parsedState = JSON.parse(rawState) as unknown;

      if (!isValidPersistedCheckoutState(parsedState)) {
        window.sessionStorage.removeItem(CHECKOUT_STATE_STORAGE_KEY);
        return;
      }

      setPaymentMethod(parsedState.paymentMethod);
      setFormData(parsedState.formData);
      setCheckboxes(parsedState.checkboxes);
    } catch {
      // Ignore malformed or unavailable storage.
    } finally {
      setHasRestoredCheckoutState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredCheckoutState) {
      return;
    }

    const stateToPersist: PersistedCheckoutState = {
      formData,
      paymentMethod,
      checkboxes,
    };

    try {
      window.sessionStorage.setItem(
        CHECKOUT_STATE_STORAGE_KEY,
        JSON.stringify(stateToPersist),
      );
    } catch {
      // Ignore storage quota or browser restrictions.
    }
  }, [checkboxes, formData, hasRestoredCheckoutState, paymentMethod]);

  const checkoutButtonLabel =
    paymentMethod === "paypal"
      ? "WEITER ZU PAYPAL"
      : paymentMethod === "sepa"
        ? "WEITER ZU STRIPE (SEPA)"
        : "WEITER ZU STRIPE";

  const handleCheckout = async () => {
    if (!isFormValid || isSubmitting) {
      return;
    }

    const endpoint =
      paymentMethod === "paypal"
        ? "/api/payments/paypal/order"
        : "/api/payments/stripe/checkout";

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageKey: initialPackage,
          paymentMethod,
          billing: formData,
          location,
          keyword,
          businessName,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            redirectUrl?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.redirectUrl) {
        throw new Error(payload?.error || "Zahlung konnte nicht gestartet werden.");
      }

      window.location.assign(payload.redirectUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Zahlung konnte nicht gestartet werden.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-6 pt-24 pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="mb-6 text-4xl font-bold text-slate-900">Rechnungsdaten</h1>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Firmenname *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(event) =>
                      handleInputChange("company", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Ihre Firma GmbH"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ansprechpartner *
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(event) =>
                      handleInputChange("contact", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Max Mustermann"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Straße + Hausnummer *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(event) =>
                      handleInputChange("street", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Musterstraße 123"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      PLZ *
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(event) => handleInputChange("zip", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Ort *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(event) => handleInputChange("city", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Berlin"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Land *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(event) =>
                      handleInputChange("country", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      handleInputChange("email", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="info@firma.de"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Telefonnummer *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      handleInputChange("phone", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+49 123 456789"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    USt-IdNr. (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.vatId}
                    onChange={(event) =>
                      handleInputChange("vatId", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="DE123456789"
                  />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Rechnung wird per E-Mail versendet.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-4xl font-bold text-slate-900">Zahlungsart auswählen</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    paymentMethod === "paypal"
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                    PP
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">PayPal</p>
                    <p className="text-sm text-slate-600">Sichere Zahlung via PayPal</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    paymentMethod === "card"
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Kreditkarte</p>
                    <p className="text-sm text-slate-600">
                      Visa, Mastercard, American Express (Stripe)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("sepa")}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    paymentMethod === "sepa"
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    SEPA
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">SEPA Lastschrift</p>
                    <p className="text-sm text-slate-600">Abbuchung via Stripe</p>
                  </div>
                </button>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.text} className="flex items-center gap-2 text-sm text-slate-600">
                    <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{point.text}</span>
                  </div>
                );
              })}
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Fragen vor der Buchung?
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <a href="mailto:info@fixmyranking.de" className="hover:underline">
                    info@fixmyranking.de
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>WhatsApp Support: +49 1579 2314177</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Direkte Antwort innerhalb der Geschäftszeiten.
              </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checkboxes.agb}
                  onChange={(event) =>
                    handleCheckboxChange("agb", event.target.checked)
                  }
                  className="peer sr-only"
                />
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-400 bg-white transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500">
                  <Check className="h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100" />
                </span>
                <span className="text-sm text-slate-700">
                  Ich akzeptiere die{" "}
                  <Link href="/agb" className="font-medium text-emerald-600 hover:underline">
                    AGB
                  </Link>{" "}
                  und{" "}
                  <a href="#" className="font-medium text-emerald-600 hover:underline">
                    Datenschutzerklärung
                  </a>
                  . *
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checkboxes.business}
                  onChange={(event) =>
                    handleCheckboxChange("business", event.target.checked)
                  }
                  className="peer sr-only"
                />
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-400 bg-white transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500">
                  <Check className="h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100" />
                </span>
                <span className="text-sm text-slate-700">
                  Ich bestätige, dass ich Unternehmer im Sinne des §14 BGB bin und die
                  Buchung im Rahmen meiner gewerblichen Tätigkeit erfolgt. *
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checkboxes.immediate}
                  onChange={(event) =>
                    handleCheckboxChange("immediate", event.target.checked)
                  }
                  className="peer sr-only"
                />
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-400 bg-white transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500">
                  <Check className="h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100" />
                </span>
                <span className="text-sm text-slate-700">
                  Ich stimme zu, dass die Dienstleistung unmittelbar nach Zahlungseingang
                  beginnt.
                </span>
              </label>

              <p className="text-xs text-slate-500">
                Mit Klick auf &quot;Jetzt kostenpflichtig buchen&quot; entsteht ein
                zahlungspflichtiger Vertrag.
              </p>
            </section>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!isFormValid || isSubmitting}
              className={`w-full rounded-xl px-8 py-5 text-lg font-bold transition-all ${
                isFormValid && !isSubmitting
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/30"
                  : "cursor-not-allowed bg-slate-300 text-slate-500"
              }`}
            >
              {isSubmitting ? "ZAHLUNGSANBIETER WIRD GEÖFFNET..." : checkoutButtonLabel}
            </button>
            {submitError && (
              <p className="text-center text-sm text-red-600">{submitError}</p>
            )}
            <p className="text-center text-sm text-slate-600">
              Sichere Zahlung - keine versteckten Gebühren.
            </p>

            <section className="mt-6 space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        openFAQ === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>

          <div className="order-first lg:order-last">
            <div className="lg:sticky lg:top-24">
              <PackageSummary packageConfig={packageConfig} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function PackageSummary({
  packageConfig,
}: {
  packageConfig: CheckoutPackageConfig;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`${packageConfig.badgeClass} rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white`}
          >
            {packageConfig.badgeLabel}
          </span>
        </div>
        <h2 className="text-4xl leading-tight font-bold text-slate-900">
          {packageConfig.name}
        </h2>
      </div>

      <div className="mb-6 border-b border-slate-200 pb-6">
        <div className="mb-4">
          <p className="text-sm text-slate-500">Laufzeit:</p>
          <p className="text-3xl font-semibold text-slate-900">{packageConfig.duration}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-slate-500">Monatspreis:</p>
          <p className="text-3xl font-semibold text-slate-900">
            {packageConfig.monthlyPrice.toFixed(2)} € netto
          </p>
        </div>
        <div className="mb-3">
          <p className="text-sm text-slate-500">Gesamtpreis:</p>
          <p className="text-6xl leading-none font-bold text-emerald-600">
            {packageConfig.totalPrice} €
          </p>
          <p className="mt-1 text-xs text-slate-500">netto</p>
        </div>
        <p className="text-xs text-slate-500">Alle Preise zzgl. gesetzlicher MwSt.</p>
      </div>

      <div className="mb-6 border-b border-slate-200 pb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Leistungsüberblick:</h3>
        <ul className="space-y-2">
          {summaryBenefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-amber-900">WICHTIGER HINWEIS</h4>
        <p className="mb-3 text-xs leading-relaxed text-amber-800">
          Automatische Verlängerung um die gewählte Vertragslaufzeit, sofern nicht 30
          Tage vor Ablauf schriftlich gekündigt wird.
        </p>
        <p className="text-xs text-amber-800">
          Kündigung per E-Mail an{" "}
          <a href="mailto:info@fixmyranking.de" className="underline">
            info@fixmyranking.de
          </a>{" "}
          möglich.
        </p>
      </div>
    </aside>
  );
}
