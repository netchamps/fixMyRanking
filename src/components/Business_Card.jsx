import { useState, useEffect } from "react";

/* ─── Design Tokens (unchanged) ─── */
const BRAND = "#1C7AE0";
const BRAND_DARK = "#1565C0";
const BRAND_LIGHT = "rgba(28,122,224,0.07)";
const NAVY = "#0A1628";
const NAVY_SUB = "#3D4F65";
const NAVY_MUTED = "#7B8CA0";
const GREEN = "#22C55E";
const GREEN_BG = "rgba(34,197,94,0.08)";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";

const STAR =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z";

/* ─── Icons (unchanged) ─── */
const IconNav = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
);
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const IconArrowUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
  </svg>
);
const IconTrophy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);
/* [#5] Replaced external link icon with a verification checkmark for the upgraded badge */
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─── Component ─── */
export default function KundenRadarHeroCard() {
  const [hov, setHov] = useState(null);
  const [cardHov, setCardHov] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      /* [#1] Switched to Manrope — geometric, premium, modern SaaS sans-serif */
      fontFamily: "'Manrope', 'Helvetica Neue', sans-serif",
      background: "transparent",
      padding: "60px 24px",
      position: "relative",
    }}>
      {/* [#1] Replaced Instrument Serif with Manrope (all weights for headline + body) */}
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Outer wrapper ── */}
      <div style={{ position: "relative", width: "100%", maxWidth: 840 }}>

        {/* ── Floating Chip: +47 Anrufe ── */}
        {/* [#3] Moved further right and up to reduce crowding near card top-right corner */}
        <div style={{
          position: "absolute",
          top: -32,
          right: 48,
          background: WHITE,
          borderRadius: 14,
          padding: "10px 16px 10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 9,
          boxShadow: "0 8px 32px -4px rgba(10,22,40,0.10), 0 0 0 1px rgba(10,22,40,0.04)",
          zIndex: 10,
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0) rotate(-1.5deg)" : "translateY(16px) rotate(-1.5deg)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "rgba(34,197,94,0.09)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: GREEN,
          }}><IconArrowUp /></div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>+47 Anrufe</div>
            <div style={{ fontSize: 10.5, color: NAVY_MUTED, fontWeight: 500, marginTop: 1 }}>diesen Monat</div>
          </div>
        </div>

        {/* ── Floating Chip: +12 Plätze ── */}
        {/* [#6] Repositioned: overlaps card bottom-left edge instead of floating detached below */}
        <div style={{
          position: "absolute",
          bottom: -18,
          left: 44,
          background: WHITE,
          borderRadius: 14,
          padding: "10px 16px 10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 9,
          boxShadow: "0 8px 32px -4px rgba(10,22,40,0.10), 0 0 0 1px rgba(10,22,40,0.04)",
          zIndex: 10,
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0) rotate(0.8deg)" : "translateY(16px) rotate(0.8deg)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: BRAND_LIGHT,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: BRAND,
          }}><IconArrowUp /></div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>+12 Plätze</div>
            <div style={{ fontSize: 10.5, color: NAVY_MUTED, fontWeight: 500, marginTop: 1 }}>im Google Ranking</div>
          </div>
        </div>

        {/* ══════ MAIN CARD ══════ */}
        <div
          onMouseEnter={() => setCardHov(true)}
          onMouseLeave={() => setCardHov(false)}
          style={{
            width: "100%",
            background: WHITE,
            borderRadius: 24,
            display: "flex",
            overflow: "hidden",
            position: "relative",
            boxShadow: cardHov
              ? "0 48px 100px -24px rgba(10,22,40,0.16), 0 24px 48px -12px rgba(10,22,40,0.07), 0 0 0 1px rgba(10,22,40,0.04), inset 0 1px 0 rgba(255,255,255,0.8)"
              : "0 32px 80px -24px rgba(10,22,40,0.11), 0 16px 32px -12px rgba(10,22,40,0.05), 0 0 0 1px rgba(10,22,40,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
            transform: cardHov ? "translateY(-3px)" : "translateY(0)",
            cursor: "default",
            opacity: show ? 1 : 0,
            transitionDelay: "0.1s",
          }}
        >
          {/* ── LEFT CONTENT ── */}
          <div style={{
            flex: 1,
            padding: "44px 44px 36px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 410,
          }}>
            {/* Top cluster */}
            <div>
              {/* Badge row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
                {/* Jetzt geöffnet */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: GREEN_BG, borderRadius: 100,
                  padding: "5.5px 13px 5.5px 9px",
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: GREEN,
                    boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                    animation: "kr-pulse 2.2s ease-in-out infinite",
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#16A34A",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>Jetzt geöffnet</span>
                </div>

                {/* Platz 1 */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: BRAND_LIGHT, borderRadius: 100,
                  padding: "5.5px 14px 5.5px 10px",
                  border: "1px solid rgba(28,122,224,0.08)",
                }}>
                  <IconTrophy />
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: BRAND,
                    letterSpacing: "0.02em",
                  }}>Platz 1 auf Google Maps</span>
                </div>
              </div>

              {/* [#1] Business Name — now Manrope 800 instead of Instrument Serif */}
              <h1 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 33,
                fontWeight: 700,
                color: NAVY,
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
                lineHeight: 1.08,
              }}>
                Musterbetrieb München
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: 15,
                color: NAVY_SUB,
                margin: "0 0 22px",
                fontWeight: 500,
                letterSpacing: "0.005em",
              }}>
                Sanitär &amp; Heizung · München Schwabing
              </p>

              {/* Rating row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ display: "flex", gap: 1.5 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} width="16" height="16" viewBox="0 0 24 24">
                      <defs>
                        {s === 5 && (
                          <linearGradient id="kr-half-star">
                            <stop offset="85%" stopColor={AMBER} />
                            <stop offset="85%" stopColor="#E5E7EB" />
                          </linearGradient>
                        )}
                      </defs>
                      <path d={STAR} fill={s <= 4 ? AMBER : "url(#kr-half-star)"} />
                    </svg>
                  ))}
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: NAVY, letterSpacing: "-0.01em" }}>4.9</span>
                <span style={{ fontSize: 12.5, color: NAVY_MUTED, fontWeight: 500 }}>(312 Bewertungen)</span>
              </div>

              {/* Value prop line */}
              <div style={{
                display: "flex", alignItems: "center", gap: 0,
                fontSize: 12.5, fontWeight: 600,
                letterSpacing: "0.015em",
              }}>
                {["Mehr Sichtbarkeit", "Mehr Anrufe", "Mehr Leads"].map((t, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ color: BRAND }}>{t}</span>
                    {i < 2 && <span style={{ color: NAVY_MUTED, opacity: 0.35, margin: "0 8px", fontSize: 10 }}>●</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom cluster */}
            <div>
              {/* [#2] CTA Buttons — Anrufen is now primary, Route is secondary */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                {/* Anrufen — PRIMARY (conversion-focused: phone call = highest intent) */}
                <button
                  onMouseEnter={() => setHov("call")}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px",
                    borderRadius: 13,
                    border: "none",
                    background: hov === "call" ? BRAND_DARK : BRAND,
                    color: WHITE,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                    transform: hov === "call" ? "translateY(-1px)" : "none",
                    boxShadow: hov === "call"
                      ? "0 12px 28px -6px rgba(28,122,224,0.45)"
                      : "0 6px 20px -6px rgba(28,122,224,0.32)",
                  }}
                ><IconPhone /> Anrufen</button>

                {/* Route — SECONDARY */}
                <button
                  onMouseEnter={() => setHov("route")}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 24px",
                    borderRadius: 13,
                    border: "1.5px solid rgba(10,22,40,0.09)",
                    background: hov === "route" ? "rgba(10,22,40,0.025)" : "transparent",
                    color: NAVY,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                    transform: hov === "route" ? "translateY(-1px)" : "none",
                  }}
                ><IconNav /> Route</button>

              </div>

              {/* [#5] KundenRadar Attribution — upgraded to a premium verification badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                padding: "8px 16px 8px 8px",
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(28,122,224,0.04) 0%, rgba(28,122,224,0.08) 100%)",
                border: "1px solid rgba(28,122,224,0.08)",
              }}>
                {/* Verified checkmark in brand gradient circle */}
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: `linear-gradient(135deg, ${BRAND} 0%, #4A9CF5 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px -2px rgba(28,122,224,0.35)",
                }}>
                  <IconCheck />
                </div>
                <span style={{
                  fontSize: 11.5, color: NAVY_SUB, fontWeight: 600,
                  letterSpacing: "0.015em",
                }}>
                  Optimiert mit{" "}
                  <span style={{ color: BRAND, fontWeight: 800 }}>KundenRadar</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT MAP PANEL ── */}
          {/* [#4] Added subtle depth layers: water feature, radius ring, more block variation */}
          <div style={{
            width: 280,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            background: "linear-gradient(155deg, #EDF2F8 0%, #E1E9F3 50%, #DAE3EF 100%)",
            borderLeft: "1px solid rgba(10,22,40,0.04)",
          }}>
            <svg
              viewBox="0 0 280 450"
              preserveAspectRatio="xMidYMid slice"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <defs>
                <filter id="kr-pin-sh" x="-50%" y="-20%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(28,122,224,0.25)" />
                </filter>
                <filter id="kr-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
                <radialGradient id="kr-pin-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(28,122,224,0.14)" />
                  <stop offset="100%" stopColor="rgba(28,122,224,0)" />
                </radialGradient>
                {/* [#4] Subtle radius indicator gradient */}
                <radialGradient id="kr-radius" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(28,122,224,0.03)" />
                  <stop offset="70%" stopColor="rgba(28,122,224,0.02)" />
                  <stop offset="100%" stopColor="rgba(28,122,224,0)" />
                </radialGradient>
                {/* [#4] Water/park gradient */}
                <linearGradient id="kr-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(28,122,224,0.05)" />
                  <stop offset="100%" stopColor="rgba(28,122,224,0.02)" />
                </linearGradient>
              </defs>

              {/* [#4] Large radius circle — subtle "coverage area" feel */}
              <circle cx="143" cy="210" r="90" fill="url(#kr-radius)" />
              <circle cx="143" cy="210" r="90" fill="none" stroke="rgba(28,122,224,0.05)" strokeWidth="1" strokeDasharray="4 3" />

              {/* Grid roads — horizontal */}
              {[65, 145, 225, 305, 385].map((y, i) => (
                <rect key={`h${i}`} x="0" y={y} width="280" height={i === 1 || i === 3 ? 4 : 3}
                  rx="1.5" fill={`rgba(10,22,40,${i === 1 ? 0.055 : 0.04})`} />
              ))}
              {/* Grid roads — vertical */}
              {[70, 140, 210].map((x, i) => (
                <rect key={`v${i}`} x={x} y="0" width={i === 1 ? 4 : 3} height="450"
                  rx="1.5" fill={`rgba(10,22,40,${i === 1 ? 0.05 : 0.035})`} />
              ))}

              {/* Blocks */}
              {[
                [10, 12, 52, 44], [80, 10, 52, 46], [150, 14, 52, 42], [220, 10, 50, 46],
                [10, 76, 52, 60], [80, 74, 52, 62], [220, 76, 50, 60],
                [10, 156, 52, 60], [150, 154, 52, 62], [220, 158, 50, 58],
                [10, 236, 52, 60], [80, 234, 52, 62], [150, 238, 52, 58], [220, 234, 50, 62],
                [10, 316, 52, 60], [80, 314, 52, 62], [150, 318, 52, 58], [220, 316, 50, 60],
                [10, 396, 52, 44], [80, 394, 52, 46], [150, 396, 52, 44], [220, 394, 50, 46],
              ].map(([x, y, w, h], i) => (
                <rect key={`b${i}`} x={x} y={y} width={w} height={h} rx="4"
                  fill={`rgba(10,22,40,${i % 3 === 0 ? 0.025 : 0.018})`} />
              ))}

              {/* [#4] Water feature — small abstract river/canal running through map */}
              <path d="M0 280 Q40 275, 70 282 T140 278 T210 284 T280 276" fill="none"
                stroke="rgba(28,122,224,0.07)" strokeWidth="8" strokeLinecap="round" />
              <path d="M0 280 Q40 275, 70 282 T140 278 T210 284 T280 276" fill="none"
                stroke="rgba(28,122,224,0.04)" strokeWidth="14" strokeLinecap="round" />

              {/* Green areas */}
              <ellipse cx="40" cy="195" rx="16" ry="10" fill="rgba(34,197,94,0.06)" />
              <ellipse cx="235" cy="360" rx="14" ry="9" fill="rgba(34,197,94,0.05)" />
              {/* [#4] Additional small green detail */}
              <rect x="84" cy="168" y="168" width="24" height="16" rx="8" fill="rgba(34,197,94,0.045)" />

              {/* Pin glow */}
              <circle cx="143" cy="200" r="40" fill="url(#kr-pin-glow)" />
              <circle cx="143" cy="200" r="16" fill="rgba(28,122,224,0.07)" filter="url(#kr-glow)" />

              {/* Ripple */}
              <circle cx="143" cy="200" r="10" fill="none" stroke="rgba(28,122,224,0.12)" strokeWidth="1.5"
                style={{ animation: "kr-ripple 3s ease-out infinite" }} />
              <circle cx="143" cy="200" r="10" fill="none" stroke="rgba(28,122,224,0.08)" strokeWidth="1"
                style={{ animation: "kr-ripple 3s ease-out infinite 1s" }} />

              {/* Location Pin */}
              <g filter="url(#kr-pin-sh)" transform="translate(143, 178)">
                <path d="M0-28c-10 0-18 8-18 18 0 14 18 32 18 32s18-18 18-32c0-10-8-18-18-18z" fill={BRAND} />
                <circle cx="0" cy="-10" r="7" fill={WHITE} />
                <circle cx="0" cy="-10" r="3" fill={BRAND} />
              </g>

              {/* [#4] Tiny secondary pins — faded, to suggest other businesses nearby */}
              <g opacity="0.25" transform="translate(58, 104)">
                <path d="M0-12c-4.4 0-8 3.6-8 8 0 6 8 14 8 14s8-8 8-14c0-4.4-3.6-8-8-8z" fill={NAVY_MUTED} />
              </g>
              <g opacity="0.18" transform="translate(222, 250)">
                <path d="M0-12c-4.4 0-8 3.6-8 8 0 6 8 14 8 14s8-8 8-14c0-4.4-3.6-8-8-8z" fill={NAVY_MUTED} />
              </g>
            </svg>

            {/* ── Top chip: Platz 1 lokal ── */}
            <div style={{
              position: "absolute",
              top: 18, left: 16, right: 16,
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              boxShadow: "0 4px 16px rgba(10,22,40,0.06), 0 0 0 1px rgba(10,22,40,0.03)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: `linear-gradient(135deg, ${BRAND} 0%, #4A9CF5 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 6px -1px rgba(28,122,224,0.3)",
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: WHITE, lineHeight: 1 }}>1</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>Platz 1 lokal</div>
                <div style={{ fontSize: 10, color: NAVY_MUTED, fontWeight: 500, marginTop: 1 }}>Google Maps · München</div>
              </div>
            </div>

            {/* ── Bottom chip: distance ── */}
            <div style={{
              position: "absolute",
              bottom: 18, left: 16, right: 16,
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(10,22,40,0.06), 0 0 0 1px rgba(10,22,40,0.03)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY_MUTED} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ fontSize: 12, color: NAVY_SUB, fontWeight: 600, letterSpacing: "0.01em" }}>
                Schwabing · 0,3 km
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kr-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes kr-ripple {
          0% { r: 10; opacity: 1; }
          100% { r: 36; opacity: 0; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}