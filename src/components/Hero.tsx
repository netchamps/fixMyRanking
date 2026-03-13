"use client";

import { Check, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import KundenRadarHeroCard from "./Business_Card";

const ROTATING_WORDS = ["Sichtbarkeit", "Kunden", "Termine", "Leads"] as const;

// Google brand colors — headline letter accents only
const G_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"] as const;

function GoogleWord() {
  return (
    <>
      {"Google".split("").map((letter, i) => (
        <span key={i} style={{ color: G_COLORS[i] }}>
          {letter}
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");

  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");

  useEffect(() => {
    const HOLD = 2800;
    const ANIM = 320;
    const id = setInterval(() => {
      setPhase("exit");
      setTimeout(() => {
        setWordIndex((i: number) => (i + 1) % ROTATING_WORDS.length);
        setPhase("enter");
        setTimeout(() => setPhase("idle"), ANIM);
      }, ANIM);
    }, HOLD);
    return () => clearInterval(id);
  }, []);

  const canSubmit = location.trim().length >= 3 && keyword.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const params = new URLSearchParams();
    params.set("location", location.trim());
    params.set("keyword", keyword.trim());
    router.push(`/analyse?${params.toString()}`);
  };

  return (
    <>
      <style>{`
        /* ── Word rotation ── */
        @keyframes word-exit {
          0%   { opacity: 1; transform: translateY(0)     rotateX(0deg);  }
          100% { opacity: 0; transform: translateY(-115%) rotateX(12deg); }
        }
        @keyframes word-enter {
          0%   { opacity: 0; transform: translateY(115%)  rotateX(-12deg); }
          100% { opacity: 1; transform: translateY(0)     rotateX(0deg);  }
        }
        .word-exit  { animation: word-exit  0.32s cubic-bezier(0.4,0,0.2,1) forwards; }
        .word-enter { animation: word-enter 0.32s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* ── CTA / input interaction ── */
        .hero-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(28,122,224,0.45) !important;
        }
        .hero-cta-secondary:hover {
          border-color: rgba(28,122,224,0.45) !important;
          color: #1C7AE0 !important;
        }
        .hero-input:focus {
          border-color: #1C7AE0 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(28,122,224,0.09) !important;
        }
        .hero-submit:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(28,122,224,0.45) !important;
        }

        /*
          Override Business_Card's outer "minHeight: 100vh" centering wrapper
          so it doesn't inflate the hero to full-screen height.
        */
        .hero-card-slot > div:first-child {
          min-height: 0 !important;
          padding: 32px 0 !important;
        }
      `}</style>

      <section
        id="hero"
        className="relative w-full scroll-mt-20"
        style={{
          background:
            "linear-gradient(155deg, #f8faff 0%, #f0f4ff 40%, #fafbff 70%, #f5f7ff 100%)",
        }}
      >
        {/* Background glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            style={{
              position: "absolute", top: "-15%", left: "5%",
              width: "700px", height: "700px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(28,122,224,0.09) 0%, transparent 65%)",
              filter: "blur(52px)",
            }}
          />
          <div
            style={{
              position: "absolute", top: "5%", right: "-10%",
              width: "560px", height: "560px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(66,133,244,0.08) 0%, transparent 65%)",
              filter: "blur(64px)",
            }}
          />
          <div
            style={{
              position: "absolute", bottom: "-5%", left: "-5%",
              width: "480px", height: "480px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)",
              filter: "blur(56px)",
            }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-24 lg:py-28">
          {/* ── Two-column grid ── */}
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

            {/* ════ LEFT: Value proposition ════ */}
            <div className="flex flex-col">

              {/* Eyebrow badge */}
              <div className="mb-8">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 18px",
                    borderRadius: "999px",
                    background: "rgba(28,122,224,0.07)",
                    border: "1px solid rgba(28,122,224,0.2)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1C7AE0",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span
                    style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#1C7AE0",
                      boxShadow: "0 0 8px rgba(28,122,224,0.65)",
                      display: "inline-block", flexShrink: 0,
                    }}
                  />
                  Lokale Google Maps Optimierung für Ihr Unternehmen
                </div>
              </div>

              {/* Headline — left-aligned */}
              <h1
                style={{
                  fontSize: "clamp(2.2rem, 3.8vw, 3.75rem)",
                  fontWeight: 800,
                  lineHeight: 1.08,
                  color: "#0d1b3e",
                  letterSpacing: "-0.03em",
                  margin: "0 0 1.5rem 0",
                }}
              >
                {/* Line 1: "Mehr [rotating word]" — left-aligned, "Mehr" never shifts */}
                <span style={{ display: "block" }}>
                  <span style={{ display: "inline-flex", alignItems: "baseline", gap: "0.25em" }}>
                    <span style={{ flexShrink: 0 }}>Mehr</span>
                    {/* Fixed-width slot = width of longest word; clips vertical animation */}
                    <span
                      style={{
                        display: "inline-block",
                        width: "7.2em",
                        flexShrink: 0,
                        overflow: "hidden",
                        height: "1.15em",
                        verticalAlign: "bottom",
                      }}
                    >
                      <span
                        key={wordIndex}
                        className={
                          phase === "exit" ? "word-exit" : phase === "enter" ? "word-enter" : ""
                        }
                        style={{
                          display: "inline-block",
                          color: "#1C7AE0",
                          whiteSpace: "nowrap",
                          transformOrigin: "center top",
                        }}
                      >
                        {ROTATING_WORDS[wordIndex]}
                      </span>
                    </span>
                  </span>
                </span>

                {/* Line 2 */}
                <span style={{ display: "block" }}>
                  auf <GoogleWord />
                  <span style={{ color: "#1C7AE0" }}>&nbsp;Maps.</span>
                </span>

                {/* Line 3 */}
                <span style={{ display: "block" }}>
                  Mehr Anfragen aus
                  <br />
                  Ihrer Region.
                </span>
              </h1>

              {/* Subheadline */}
              <p
                style={{
                  fontSize: "clamp(1rem, 1.6vw, 1.125rem)",
                  lineHeight: 1.75,
                  color: "#64748b",
                  fontWeight: 400,
                  margin: "0 0 2.25rem 0",
                  maxWidth: "42ch",
                }}
              >
                Transparente Analyse. Strukturierte Optimierung.{" "}
                <span style={{ color: "#1e293b", fontWeight: 600 }}>
                  Messbare lokale Präsenz.
                </span>
              </p>

              {/* CTA row */}
              <div className="mb-10 flex flex-wrap gap-3">
                <a
                  href="#analyse-card"
                  className="hero-cta-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px 28px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #1C7AE0 0%, #1351a8 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                    boxShadow: "0 8px 32px rgba(28,122,224,0.32)",
                    transition: "all 0.22s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  Kostenlose Analyse starten
                </a>
                <a
                  href="/#beispiel"
                  className="hero-cta-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px 22px",
                    borderRadius: "14px",
                    background: "transparent",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                    border: "1.5px solid rgba(15,23,42,0.13)",
                    transition: "all 0.22s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  Beispiel ansehen
                </a>
              </div>

              {/* ── Analysis card ── */}
              <div
                id="analyse-card"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(24px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(226,232,240,0.85)",
                  boxShadow:
                    "0 20px 56px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                  padding: "32px",
                }}
              >
                <div style={{ marginBottom: "22px" }}>
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#0d1b3e",
                      margin: "0 0 5px 0",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Ihren Standort jetzt analysieren
                  </h2>
                  <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0 }}>
                    Kostenlos · Unverbindlich · Ergebnis in unter 60 Sekunden
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    {/* Location */}
                    <div>
                      <label
                        htmlFor="location"
                        style={{
                          display: "block", marginBottom: "7px",
                          fontSize: "11px", fontWeight: 700,
                          color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase",
                        }}
                      >
                        Standort
                      </label>
                      <div style={{ position: "relative" }}>
                        <MapPin
                          style={{
                            position: "absolute", top: "50%", left: "13px",
                            transform: "translateY(-50%)",
                            width: 16, height: 16, color: "#94a3b8", pointerEvents: "none",
                          }}
                        />
                        <input
                          id="location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="z.B. Firmenname + Stadt"
                          className="hero-input"
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 38px",
                            borderRadius: "11px",
                            border: "1.5px solid #e2e8f0",
                            fontSize: "13.5px",
                            color: "#0f172a",
                            background: "#f8fafc",
                            outline: "none",
                            transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    {/* Keyword */}
                    <div>
                      <label
                        htmlFor="keyword"
                        style={{
                          display: "block", marginBottom: "7px",
                          fontSize: "11px", fontWeight: 700,
                          color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase",
                        }}
                      >
                        Keyword
                      </label>
                      <div style={{ position: "relative" }}>
                        <Search
                          style={{
                            position: "absolute", top: "50%", left: "13px",
                            transform: "translateY(-50%)",
                            width: 16, height: 16, color: "#94a3b8", pointerEvents: "none",
                          }}
                        />
                        <input
                          id="keyword"
                          type="text"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder="z.B. Restaurant"
                          className="hero-input"
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 38px",
                            borderRadius: "11px",
                            border: "1.5px solid #e2e8f0",
                            fontSize: "13.5px",
                            color: "#0f172a",
                            background: "#f8fafc",
                            outline: "none",
                            transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="hero-submit"
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "11px",
                      border: "none",
                      background: canSubmit
                        ? "linear-gradient(135deg, #1C7AE0 0%, #1351a8 100%)"
                        : "#f1f5f9",
                      color: canSubmit ? "white" : "#94a3b8",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      boxShadow: canSubmit ? "0 8px 28px rgba(28,122,224,0.3)" : "none",
                      transition: "all 0.22s ease",
                      marginBottom: "14px",
                    }}
                  >
                    Analyse starten →
                  </button>

                  {/* Trust row */}
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
                    {["100% unverbindlich", "Keine Verpflichtung", "DSGVO-konform"].map((text) => (
                      <div
                        key={text}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          fontSize: "11.5px", color: "#64748b", fontWeight: 500,
                        }}
                      >
                        <Check style={{ width: 12, height: 12, color: "#1C7AE0", flexShrink: 0 }} />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </div>

            {/* ════ RIGHT: Business_Card showcase ════ */}
            <div
              className="hero-card-slot flex items-center justify-center lg:justify-end"
              style={{ minHeight: "400px" }}
            >
              <KundenRadarHeroCard />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
