import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
        <div className="inline-flex items-center gap-2 text-slate-700">
          <Image src="/logo.png" alt="KundenRadar24" width={32} height={32} className="h-8 w-8 rounded-md" />
          <span className="font-semibold">KundenRadar24</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/impressum" className="hover:text-slate-700 hover:underline">
            Impressum
          </Link>
          <Link href="/agb" className="hover:text-slate-700 hover:underline">
            AGB
          </Link>
          <p>© {new Date().getFullYear()} KundenRadar24. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
