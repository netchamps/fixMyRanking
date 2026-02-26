import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pt-28 pb-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-3 text-3xl font-bold text-slate-900">Zahlung abgebrochen</h1>
          <p className="mx-auto mb-8 max-w-xl text-slate-600">
            Es wurde keine Zahlung durchgeführt. Du kannst jederzeit zurück zum Checkout
            und die Buchung erneut starten.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Zurück zum Checkout
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Pakete ansehen
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
