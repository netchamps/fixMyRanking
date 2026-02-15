import { MapPin } from "lucide-react";

const navItems = [
  { href: "#hero", label: "Start" },
  { href: "#beispiel", label: "Beispiel" },
  { href: "#ergebnisse", label: "Ergebnisse" },
  { href: "#leistungen", label: "Leistungen" },
  { href: "#faq", label: "FAQ" },
];

export function Navigation() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <a href="#hero" className="inline-flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold text-slate-900">LocalRank Pro</span>
        </a>

        <nav
          aria-label="Hauptnavigation"
          className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                item.href === "#hero"
                  ? "text-emerald-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#hero"
          className="hidden items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 md:inline-flex">
          Kostenlose Analyse starten
        </a>
      </div>
    </header>
  );
}
