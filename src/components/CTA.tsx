import Link from "next/link";

type CTAProps = {
  href?: string;
};

export function CTA({ href = "/#hero" }: CTAProps) {
  return (
    <section id="start" className="mx-auto w-full max-w-7xl px-6 py-20">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-12 text-center text-white shadow-xl">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Bereit, mehr lokale Kunden zu gewinnen?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-emerald-50">
          Starten Sie jetzt Ihre kostenlose Analyse und sehen Sie, wie Ihre lokale Sichtbarkeit verbessert
          werden kann.
        </p>
        <Link
          href={href}
          className="inline-flex transform rounded-lg bg-white px-8 py-4 font-semibold text-emerald-600 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl"
        >
          Kostenlose Analyse starten
        </Link>
      </div>
    </section>
  );
}
