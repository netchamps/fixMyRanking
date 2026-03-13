"use client";

import { Check, MapPin, Search, Shield, Star, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");

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
          box-shadow: 0 16px 48px rgba(16,185,129,0.45) !important;
        }
        .hero-cta-secondary:hover {
          border-color: rgba(16,185,129,0.5) !important;
          color: #10b981 !important;
        }
        .hero-input:focus {
          border-color: #10b981 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08) !important;
        }
        .hero-submit:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(16,185,129,0.45) !important;
        }
      `}</style>

      <section
        id="hero"
        className="relative w-full scroll-mt-20"
        style={{
          background:
            "linear-gradient(155deg, #f7fffe 0%, #f0fdf9 35%, #fafbff 65%, #f5f3ff 100%)",
        }}
      >
        {/* Background glow orbs — clipped inside */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "15%",
              width: "700px",
              height: "700px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 65%)",
              filter: "blur(48px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "10%",
              right: "-8%",
              width: "560px",
              height: "560px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)",
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
                "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 65%)",
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
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.22)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#059669",
                letterSpacing: "0.01em",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px rgba(16,185,129,0.7)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Lokale Google Maps Optimierung für Ihr Unternehmen
            </div>
          </div>

          {/* Headline block — floating chips positioned here */}
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
                  background: "linear-gradient(135deg, #10b981, #0d9488)",
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
              <Zap style={{ width: 15, height: 15, color: "#10b981", flexShrink: 0 }} />
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
                color: "#0f172a",
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Mehr Sichtbarkeit auf
              <br />
              <span
                style={{
                  color: "#10b981",
                  display: "inline-block",
                }}
              >
                Google&nbsp;Maps.
              </span>{" "}
              Mehr
              <br />
              Anfragen aus Ihrer Region.
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
            <span style={{ color: "#334155", fontWeight: 600 }}>
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
                background: "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(16,185,129,0.32)",
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
                  color: "#0f172a",
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
                    ? "linear-gradient(135deg, #10b981 0%, #0d9488 100%)"
                    : "#f1f5f9",
                  color: canSubmit ? "white" : "#94a3b8",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  boxShadow: canSubmit ? "0 8px 28px rgba(16,185,129,0.3)" : "none",
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
                      style={{ width: 13, height: 13, color: "#10b981", flexShrink: 0 }}
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
