import { readFile } from "node:fs/promises";
import path from "node:path";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

async function getImpressumText() {
  return readFile(
    path.join(process.cwd(), "src/content/legal/impressum.txt"),
    "utf8",
  );
}

export default async function ImpressumPage() {
  const impressumText = await getImpressumText();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />

      <main className="mx-auto w-full max-w-4xl px-6 pt-28 pb-16">
        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-3xl font-bold text-slate-900 md:text-4xl">Impressum</h1>

          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
            {impressumText}
          </pre>
        </article>
      </main>

      <Footer />
    </div>
  );
}
