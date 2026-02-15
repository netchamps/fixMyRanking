import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
        <div className="inline-flex items-center gap-2 text-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="font-semibold">FixMyRanking</span>
        </div>

        <p>© {new Date().getFullYear()} FixMyRanking. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
}
