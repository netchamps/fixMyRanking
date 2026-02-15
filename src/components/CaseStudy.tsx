import Image from "next/image";

export function CaseStudy() {
  return (
    <section id="fallstudie" className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          Fallstudie: Vom lokalen Unsichtbarkeitsproblem zur Google-Maps-Dominanz
        </h2>
        <p className="mx-auto mb-4 max-w-3xl text-sm text-slate-600">
          Fuer einen lokalen Fachhandel fuer Sammelkarten in Muenchen wurde ueber mehrere Monate hinweg
          eine gezielte Local-SEO-Optimierung umgesetzt. Ausgangspunkt war eine sehr geringe Sichtbarkeit
          ausserhalb des direkten Standorts. Ziel war es, die Google-Maps-Positionen im gesamten
          Stadtgebiet nachhaltig zu verbessern.
        </p>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Vorher</h3>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            <strong>Ausgangslage vor der Optimierung:</strong>
            <br />
            Zu Beginn war das Unternehmen in vielen Bereichen Muenchens kaum sichtbar. In zahlreichen
            Stadtteilen lag die Position bei 20+ und potenzielle Kunden ausserhalb des direkten Umfelds
            wurden ueber Google Maps nicht erreicht.
          </p>
          <div className="overflow-hidden rounded border border-slate-200">
            <Image
              src="/assets/figma/case-before.png"
              alt="Vor der Optimierung"
              width={1000}
              height={1000}
              className="h-auto w-full"
            />
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Nachher</h3>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            <strong>Situation nach mehreren Monaten Optimierung:</strong>
            <br />
            Nach kontinuierlicher Optimierung zeigte sich ein deutlich verbessertes Bild. Das Unternehmen
            erreichte zahlreiche Top-1-, Top-2- und Top-3-Positionen in relevanten Suchgebieten im
            gesamten Stadtgebiet.
          </p>
          <div className="overflow-hidden rounded border border-slate-200">
            <Image
              src="/assets/figma/case-after.png"
              alt="Nach der Optimierung"
              width={1000}
              height={1000}
              className="h-auto w-full"
            />
          </div>
        </article>
      </div>

      <div className="mb-3">
        <p className="mx-auto max-w-3xl text-center text-sm text-slate-600">
          Diese Fallstudie zeigt, welches Potenzial in einer datenbasierten und langfristig
          ausgerichteten Local-SEO-Strategie steckt. Durch gezielte Optimierung lokaler Relevanzsignale
          konnte die Sichtbarkeit deutlich ausgeweitet und nachhaltig verbessert werden.
        </p>
      </div>

      <div className="mb-3 rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <p className="text-center text-sm text-slate-700">
          <strong>Ergebnis:</strong> Gezielte Optimierung des Google Business Profils und lokaler
          Relevanzsignale fuhrte zu deutlich verbesserter Sichtbarkeit im gesamten Stadtgebiet.
        </p>
      </div>

      <p className="mx-auto max-w-3xl text-center text-xs text-slate-500">
        Die dargestellte Fallstudie basiert auf einem realen Kundenprojekt. Ergebnisse koennen je nach
        Branche, Standort, Wettbewerb und Ausgangssituation variieren.
      </p>
    </section>
  );
}
