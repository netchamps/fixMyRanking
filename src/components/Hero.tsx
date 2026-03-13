"use client";

import { Check, MapPin, Search, Shield, Star, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Sichtbarkeit", "Kunden", "Termine", "Leads"] as const;

// Google brand colors — used only for headline letter accents
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

  // Word rotation
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");

  useEffect(() => {
    const HOLD = 2800;   // ms each word is visible
    const ANIM = 320;    // ms each half-animation (exit or enter)

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
        @keyframes float-a {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-c {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-11px); }
        }
        @keyframes float-d {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .hero-float-a { animation: float-a 4.2s ease-in-out infinite; }
        .hero-float-b { animation: float-b 5.1s ease-in-out infinite; }
        .hero-float-c { animation: float-c 3.9s ease-in-out infinite; }
        .hero-float-d { animation: float-d 5.8s ease-in-out infinite; }
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

        /* ── Rotating word ── */
        @keyframes word-exit {
          0%   { opacity: 1; transform: translateY(0)    rotateX(0deg);  }
          100% { opacity: 0; transform: translateY(-115%) rotateX(12deg); }
        }
        @keyframes word-enter {
          0%   { opacity: 0; transform: translateY(115%)  rotateX(-12deg); }
          100% { opacity: 1; transform: translateY(0)    rotateX(0deg);  }
        }
        .word-exit  { animation: word-exit  0.32s cubic-bezier(0.4,0,0.2,1) forwards; }
        .word-enter { animation: word-enter 0.32s cubic-bezier(0.4,0,0.2,1) forwards; }
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
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "10%",
              width: "720px",
              height: "720px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(28,122,224,0.09) 0%, transparent 65%)",
              filter: "blur(52px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "5%",
              right: "-8%",
              width: "560px",
              height: "560px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(66,133,244,0.08) 0%, transparent 65%)",
              filter: "blur(64px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-5%",
              left: "-5%",
              width: "480px",
              height: "480px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)",
              filter: "blur(56px)",
            }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 pt-24 pb-32">
          {/* Eyebrow badge */}
          <div className="mb-10 flex justify-center">
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
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#1C7AE0",
                  boxShadow: "0 0 8px rgba(28,122,224,0.65)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Lokale Google Maps Optimierung für Ihr Unternehmen
            </div>
          </div>

          {/* Headline block with floating chips */}
          <div className="relative mx-auto mb-8 max-w-4xl text-center">
            {/* Floating chip: top-left */}
            <div
              className="hero-float-a absolute hidden items-center gap-2.5 xl:flex"
              style={{
                top: "8px",
                left: "-180px",
                padding: "11px 15px",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(14px)",
                borderRadius: "14px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 28px rgba(0,0,0,0.07)",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "9px",
                  background: "linear-gradient(135deg, #1C7AE0, #1351a8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TrendingUp style={{ width: 17, height: 17, color: "white" }} />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                  Ranking verbessert
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                  Position 12 → 2
                </div>
              </div>
            </div>

            {/* Floating chip: top-right */}
            <div
              className="hero-float-b absolute hidden items-center gap-2 xl:flex"
              style={{
                top: "-4px",
                right: "-160px",
                padding: "10px 15px",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(14px)",
                borderRadius: "12px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 28px rgba(0,0,0,0.07)",
                whiteSpace: "nowrap",
              }}
            >
              <Zap style={{ width: 15, height: 15, color: "#1C7AE0", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                Analyse in Sekunden
              </span>
            </div>

            {/* Floating chip: bottom-left */}
            <div
              className="hero-float-c absolute hidden items-center gap-2 xl:flex"
              style={{
                bottom: "24px",
                left: "-148px",
                padding: "10px 15px",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(14px)",
                borderRadius: "12px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 28px rgba(0,0,0,0.07)",
                whiteSpace: "nowrap",
              }}
            >
              <Shield style={{ width: 15, height: 15, color: "#6366f1", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                DSGVO-konform
              </span>
            </div>

            {/* Floating chip: bottom-right */}
            <div
              className="hero-float-d absolute hidden items-center gap-2 xl:flex"
              style={{
                bottom: "8px",
                right: "-172px",
                padding: "10px 15px",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(14px)",
                borderRadius: "12px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 28px rgba(0,0,0,0.07)",
                whiteSpace: "nowrap",
              }}
            >
              <Star style={{ width: 15, height: 15, color: "#f59e0b", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                Mehr lokale Sichtbarkeit
              </span>
            </div>

            {/* The headline */}
            <h1
              style={{
                fontSize: "clamp(2.6rem, 6.5vw, 5.25rem)",
                fontWeight: 800,
                lineHeight: 1.06,
                color: "#0d1b3e",
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              {/*
                Line 1: "Mehr [word]" — visually centred, "Mehr" never moves.
                The flex group has a CONSTANT total width because the word slot
                has a fixed CSS width (7.2em ≈ "Sichtbarkeit" at this font).
                justify-content: center → group is centred on the line.
                Word is left-aligned inside the slot → gap to "Mehr" is always 0.25em.
              */}
              <span style={{ display: "flex", justifyContent: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: "0.25em",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>Mehr</span>

                  {/* Fixed-width slot — clips the slide animation cleanly */}
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
                        phase === "exit"
                          ? "word-exit"
                          : phase === "enter"
                            ? "word-enter"
                            : ""
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

              {/* Line 2: "auf Google Maps." */}
              <span style={{ display: "block" }}>
                auf <GoogleWord />
                <span style={{ color: "#1C7AE0" }}>&nbsp;Maps.</span>
              </span>

              {/* Line 3: "Mehr Anfragen aus Ihrer Region." */}
              <span style={{ display: "block" }}>
                Mehr Anfragen aus Ihrer Region.
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p
            className="mx-auto mb-11 max-w-xl text-center"
            style={{
              fontSize: "clamp(1.05rem, 1.8vw, 1.2rem)",
              lineHeight: 1.75,
              color: "#64748b",
              fontWeight: 400,
            }}
          >
            Transparente Analyse. Strukturierte Optimierung.{" "}
            <span style={{ color: "#1e293b", fontWeight: 600 }}>
              Messbare lokale Präsenz.
            </span>
          </p>

          {/* CTA row */}
          <div className="mb-20 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#analyse-card"
              className="hero-cta-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px 32px",
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
                padding: "16px 26px",
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

          {/* Analysis card */}
          <div
            id="analyse-card"
            className="mx-auto max-w-2xl"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(24px)",
              borderRadius: "24px",
              border: "1px solid rgba(226,232,240,0.85)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.08), 0 4px 18px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
              padding: "40px",
            }}
          >
            <div style={{ marginBottom: "28px" }}>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#0d1b3e",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                Ihren Standort jetzt analysieren
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: 0 }}>
                Kostenlos · Unverbindlich · Ergebnis in unter 60 Sekunden
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {/* Location input */}
                <div>
                  <label
                    htmlFor="location"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#374151",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Standort
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "14px",
                        transform: "translateY(-50%)",
                        width: 17,
                        height: 17,
                        color: "#94a3b8",
                        pointerEvents: "none",
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
                        padding: "13px 16px 13px 42px",
                        borderRadius: "12px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        color: "#0f172a",
                        background: "#f8fafc",
                        outline: "none",
                        transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Keyword input */}
                <div>
                  <label
                    htmlFor="keyword"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#374151",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Keyword
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "14px",
                        transform: "translateY(-50%)",
                        width: 17,
                        height: 17,
                        color: "#94a3b8",
                        pointerEvents: "none",
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
                        padding: "13px 16px 13px 42px",
                        borderRadius: "12px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
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
                  padding: "15px",
                  borderRadius: "12px",
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
                  marginBottom: "16px",
                }}
              >
                Analyse starten →
              </button>

              {/* Trust row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "20px",
                }}
              >
                {[
                  "100% unverbindlich",
                  "Keine Verpflichtung",
                  "DSGVO-konform",
                ].map((text) => (
                  <div
                    key={text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    <Check
                      style={{ width: 13, height: 13, color: "#1C7AE0", flexShrink: 0 }}
                    />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
