import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/#hero", label: "Start" },
  { href: "/#beispiel", label: "Beispiel" },
  { href: "/#ergebnisse", label: "Ergebnisse" },
  { href: "/#leistungen", label: "Leistungen" },
  { href: "/#faq", label: "FAQ" },
];

export function Navigation() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/#hero" className="inline-flex items-center gap-2">
          <Image src="/logo.png" alt="KundenRadar24" width={40} height={40} className="h-10 w-10 rounded-lg" />
          <span className="text-lg font-semibold text-slate-900">KundenRadar24</span>
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                item.href === "/#hero"
                  ? "text-emerald-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#hero"
          className="hidden items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 md:inline-flex">
          Kostenlose Analyse starten
        </Link>
      </div>
    </header>
  );
}
