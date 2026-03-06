"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  id: string;
  label: string;
  items: FAQItem[];
};

const faqData: FAQCategory[] = [
  {
    id: "allgemein",
    label: "Allgemein",
    items: [
      {
        question: "Was genau macht KundenRadar24?",
        answer:
          "KundenRadar24 analysiert Ihre lokale Sichtbarkeit in Google Maps und optimiert gezielt die Faktoren, die Ihr Ranking beeinflussen.",
      },
      {
        question: "Ist KundenRadar24 nur ein Analyse-Tool?",
        answer:
          "Nein. Die Analyse ist der erste Schritt. Der Fokus liegt auf der aktiven Optimierung Ihres Google Business Profils und relevanter lokaler Ranking-Signale.",
      },
      {
        question: "Für welche Unternehmen eignet sich KundenRadar24?",
        answer:
          "KundenRadar24 eignet sich für lokal tätige Unternehmen, z.B. Handwerksbetriebe, Dienstleister, Praxen, Gastronomie und Einzelhandel.",
      },
      {
        question: "Was unterscheidet KundenRadar24 von klassischem SEO?",
        answer:
          "KundenRadar24 konzentriert sich gezielt auf lokale Google-Maps-Rankings, also dort, wo lokale Kunden tatsächlich suchen.",
      },
    ],
  },
  {
    id: "prozess",
    label: "Prozess",
    items: [
      {
        question: "Wie läuft der Prozess ab?",
        answer:
          "Zuerst analysieren wir Ihre Google-Maps-Sichtbarkeit rund um Ihren Standort anhand realer Suchpunkte. Danach leiten wir konkrete Optimierungsmaßnahmen ab und setzen diese um.",
      },
      {
        question: "Wann sind erste Ergebnisse sichtbar?",
        answer:
          "Erste sichtbare Verbesserungen können, abhängig von Ausgangslage und Wettbewerb, häufig nach etwa 30 Tagen erkennbar werden.",
      },
      {
        question: "Sind Top-3-Rankings garantiert?",
        answer:
          "Nein. Google-Rankings hängen von vielen Faktoren wie Wettbewerb, Standort und Marktumfeld ab. Wir arbeiten mit bewährten Methoden, aber ohne starre Garantien.",
      },
      {
        question: "Ist die Optimierung Google-konform?",
        answer:
          "Ja. Alle Maßnahmen erfolgen im Einklang mit den offiziellen Google-Vorgaben und setzen auf nachhaltige Optimierung.",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      {
        question: "Was bedeutet Bewertungsmanagement bei KundenRadar24?",
        answer:
          "Wir unterstützen Sie beim Umgang mit negativen Google-Bewertungen und übernehmen die strukturierte Bearbeitung problematischer Einträge.",
      },
      {
        question: "Brauche ich technische Vorkenntnisse?",
        answer:
          "Nein. Sie müssen sich um keine technischen Details kümmern. Analyse und Optimierung werden vollständig übernommen.",
      },
      {
        question: "Wie starte ich mit KundenRadar24?",
        answer:
          "Geben Sie Standort und Keyword ein. Sie erhalten eine erste Auswertung Ihrer lokalen Sichtbarkeit und sehen direkt Optimierungspotenziale.",
      },
    ],
  },
];

function FAQAccordion({
  item,
  isOpen,
  onClick,
}: {
  item: FAQItem;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between bg-white p-5 text-left transition-colors hover:bg-slate-50">
        <span className="pr-4 font-semibold text-slate-900">
          {item.question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="bg-white px-5 pt-0 pb-5">
          <p className="leading-relaxed text-slate-600">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const [activeTab, setActiveTab] = useState("allgemein");
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({
    allgemein: null,
    prozess: null,
    support: null,
  });

  const toggleItem = (categoryId: string, index: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === index ? null : index,
    }));
  };

  const activeCategory = faqData.find((category) => category.id === activeTab);

  return (
    <section id="faq" className="mx-auto w-full max-w-5xl scroll-mt-28 px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-4xl font-bold text-slate-900">
          Wir haben Antworten auf Ihre Fragen
        </h2>
        <p className="mx-auto max-w-3xl text-xl text-slate-600">
          Hier finden Sie die wichtigsten Fragen rund um KundenRadar24, unsere
          Leistungen und den Ablauf.
        </p>
      </div>

      <div className="mb-8 flex justify-center gap-2 border-b border-slate-200">
        {faqData.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={`relative px-6 py-3 font-medium transition-colors ${
              activeTab === category.id
                ? "text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
            }`}>
            {category.label}
            {activeTab === category.id && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-emerald-600" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeCategory?.items.map((item, index) => (
          <FAQAccordion
            key={item.question}
            item={item}
            isOpen={openItems[activeTab] === index}
            onClick={() => toggleItem(activeTab, index)}
          />
        ))}
      </div>
    </section>
  );
}
