import React from "react";
import { X } from "lucide-react";

// Shared "notebook" look: ruled paper, thick ink outlines, hard offset shadows,
// Patrick Hand headings + Nunito body. Everything reads colors from the theme object T.

export const HEAD = "'Patrick Hand', cursive";
export const BODY = "'Nunito', system-ui, sans-serif";
export const MONO = "ui-monospace, Menlo, Consolas, monospace";

export const THEMES = {
  light: {
    desk: "#D9DFF5", bg: "#FDFCF8", bgElevated: "#FFFFFF", card: "#FFFFFF",
    rule: "#D8E3F6", margin: "#F27C7A",
    border: "#232B5E", cardBorder: "#E1E7F4",
    ink: "#26304F", inkMuted: "#66728F", inkFaint: "#66728F",
    accent: "#232B5E", onAccent: "#FDFCF8", accentSoft: "#C9E3FB",
    positive: "#1C8A5E", negative: "#C0392B", dangerSoft: "#FFC8D6",
    hl: "#FFE76B", pink: "#FFC8D6", peach: "#FFDDBF", butter: "#FFF0A8", mint: "#BFEBD9", sky: "#C9E3FB", lav: "#DDD3F8",
    onPastel: "#232B5E", shadow: "3px 3px 0 #232B5E", cover: "#232B5E",
    face: "#DDE3F3", bl: "#FFFFFF", bdk: "#7B86A8", fbg: "#FFFFFF",
    overlay: "rgba(10,15,40,0.55)", isDark: false,
  },
  dark: {
    desk: "#04050A", bg: "#12141D", bgElevated: "#1E2232", card: "#1E2232",
    rule: "#1F2333", margin: "#D0686C",
    border: "#CBD0E4", cardBorder: "#3A4160",
    ink: "#F5F6FB", inkMuted: "#B0B7CE", inkFaint: "#B0B7CE",
    accent: "#CBD0E4", onAccent: "#12141D", accentSoft: "#33577A",
    positive: "#67C79B", negative: "#E58A84", dangerSoft: "#6E4558",
    hl: "#E2BE4E", pink: "#6E4558", peach: "#70533C", butter: "#6A5E2E", mint: "#2F6552", sky: "#33577A", lav: "#554C86",
    onPastel: "#F5F6FB", shadow: "3px 3px 0 #CBD0E4", cover: "#171A2B",
    face: "#232739", bl: "#2E3550", bdk: "#050507", fbg: "#0B0C10",
    overlay: "rgba(0,0,0,0.65)", isDark: true,
  },
};

export const globalCss = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;600;700;800&display=swap');
:root { color-scheme: ${T.isDark ? "dark" : "light"}; }
html, body, #root { margin: 0; padding: 0; width: 100%; }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { overflow-x: hidden; background: ${T.desk}; font: 15px/1.4 ${BODY}; }
button { font-family: inherit; touch-action: manipulation; }
:focus-visible { outline: 3px solid ${T.border} !important; outline-offset: 2px; }
.nota-bare:focus-visible { outline: none !important; }
.nota-pill:focus-within { outline: 3px solid ${T.border}; outline-offset: 2px; }
input::placeholder, textarea::placeholder { color: ${T.inkMuted}; opacity: .8; }
select option { color: #26304F; background: #fff; }

/* paper + red margin line */
.nota-app {
  max-width: 520px; margin: 0 auto; min-height: 100vh; position: relative;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 130px 30px;
  background: repeating-linear-gradient(transparent 0 27px, ${T.rule} 27px 28px), ${T.bg};
  box-shadow: 0 0 40px rgba(20,40,100,.2); color: ${T.ink}; font-family: ${BODY};
}
.nota-app::before { content: ""; position: absolute; left: 22px; top: 0; bottom: 0; width: 2px; background: ${T.margin}; opacity: .7; }
@media (min-width: 720px) { .nota-app { max-width: 720px; } }

/* sticky pill header */
.nota-top {
  display: flex; gap: 8px; align-items: center; background: ${T.bgElevated}; border: 2px solid ${T.border};
  border-radius: 99px; padding: 6px; position: sticky; top: calc(6px + env(safe-area-inset-top, 0px)); z-index: 10;
  box-shadow: ${T.shadow}; margin-bottom: 18px;
}

/* floating pill nav */
.nota-nav {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  width: min(452px, calc(100% - 20px)); background: ${T.bgElevated}; border: 2px solid ${T.border};
  border-radius: 99px; padding: 5px; display: flex; z-index: 20; box-shadow: ${T.shadow};
}
.nota-nav button {
  flex: 1; position: relative; min-height: 54px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px; border: 0; background: transparent; border-radius: 99px; font: 800 10px ${BODY}; color: ${T.inkMuted}; cursor: pointer;
}
.nota-nav button[aria-pressed="true"] { background: ${T.hl}; color: #232B5E; }
.nota-badge {
  position: absolute; top: 2px; right: 16%; background: ${T.margin}; color: #fff; font: 800 10px ${BODY};
  border-radius: 99px; min-width: 17px; height: 17px; display: grid; place-items: center; padding: 0 4px;
}

/* notebook cover (dashboard hero + login) */
.nota-cover {
  border-radius: 6px 22px 22px 6px; background: ${T.cover}; padding: 22px 18px 16px 26px; position: relative; color: #fff;
  box-shadow: 5px 5px 0 ${T.border}; border: 2px solid ${T.border};
  background-image: radial-gradient(rgba(255,255,255,.12) 1.5px, transparent 1.6px); background-size: 14px 14px;
}
.nota-cover::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: rgba(0,0,0,.28); border-radius: 4px 0 0 4px; }
.nota-label { background: #fff; color: #232B5E; border-radius: 8px; padding: 10px 14px; transform: rotate(-1.5deg); text-align: center; border: 2px solid #232B5E; }
.nota-label h1 { font-family: ${HEAD}; font-weight: 400; font-size: 38px; line-height: 1; margin: 2px 0 0; color: #3F5FD8; }
.nota-label u { text-decoration-color: ${T.hl}; text-decoration-thickness: 6px; text-underline-offset: -3px; text-decoration-skip-ink: none; }
.nota-label small { font-size: 12px; font-weight: 700; }
.nota-cover .nota-tag {
  position: absolute; left: 8px; top: 6px; background: ${T.hl}; color: #232B5E; font: 800 10px ${BODY};
  padding: 1px 7px; border-radius: 5px; transform: rotate(-4deg);
}

@keyframes nota-spin { to { transform: rotate(360deg); } }
.animate-spin { animation: nota-spin 1s linear infinite; }

.nota-bevel:active { border-color: ${T.bdk} ${T.bl} ${T.bl} ${T.bdk} !important; }
@keyframes nota-blink { 50% { opacity: 0; } }
.nota-caret { display: inline-block; width: 9px; height: 1em; background: currentColor; vertical-align: -2px; margin-left: 3px; animation: nota-blink 1s steps(1) infinite; }

/* motion */
button { transition: transform 0.12s ease, opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
button:active { transform: scale(0.96); }
input, select, textarea { transition: border-color 0.15s ease, background-color 0.2s ease; }
@keyframes nota-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes nota-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes nota-slide-in-left { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes nota-scale-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes nota-toast { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
.nota-overlay { animation: nota-fade-in 0.18s ease; }
.nota-sheet { animation: nota-slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
.nota-sidebar { animation: nota-slide-in-left 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
.nota-page { animation: nota-scale-in 0.18s ease; }
.nota-row { animation: nota-fade-in 0.2s ease; }
.nota-toast { animation: nota-toast 0.3s cubic-bezier(.3,1.2,.5,1); }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

/* ---------- shared style helpers ---------- */

export const cardStyle = (T, extra) => ({
  background: T.bgElevated, border: `2px solid ${T.border}`, borderRadius: 14, boxShadow: T.shadow, ...extra,
});

export function inputStyle(T) {
  return {
    border: `2px solid ${T.border}`, borderRadius: 12, padding: "0 12px", minHeight: 44, background: T.bgElevated,
    color: T.ink, outline: "none", fontFamily: BODY, width: "100%", fontSize: 16, minWidth: 0, boxSizing: "border-box",
  };
}
export function textareaStyle(T) {
  return { ...inputStyle(T), padding: "8px 12px", minHeight: 92, resize: "vertical" };
}
export function compactInputStyle(T) {
  return { ...inputStyle(T), minHeight: 40, borderRadius: 10, fontSize: 14, padding: "0 10px" };
}
export function primaryBtnStyle(T) {
  return {
    background: T.accent, color: T.onAccent, border: `2px solid ${T.border}`, borderRadius: 12, padding: "0 16px", minHeight: 46,
    fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: BODY, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 6, boxShadow: `3px 3px 0 ${T.hl}`,
  };
}
export function secondaryBtnStyle(T) {
  return { ...primaryBtnStyle(T), background: T.bgElevated, color: T.ink, boxShadow: "none" };
}
export function ghostBtnStyle(T) {
  return {
    display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, minHeight: 40, padding: "0 14px", borderRadius: 12,
    border: `2px dashed ${T.border}`, background: "transparent", color: T.ink, cursor: "pointer", fontFamily: BODY,
  };
}
export function iconBtnStyle(T) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%",
    border: `2px solid ${T.border}`, background: T.bgElevated, cursor: "pointer", color: T.ink, flexShrink: 0, padding: 0,
  };
}
export function iconOnlyBtn(T, active) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12,
    border: `2px solid ${T.border}`, background: active ? T.hl : T.bgElevated, cursor: "pointer",
    color: active ? "#232B5E" : T.ink, flexShrink: 0, position: "relative", padding: 0,
  };
}
export function filterSelectStyle(T) {
  return {
    border: `2px solid ${T.border}`, borderRadius: 999, padding: "0 12px", minHeight: 36, background: T.bgElevated, color: T.ink,
    outline: "none", fontFamily: BODY, fontWeight: 700, fontSize: 12, flex: "1 1 auto", minWidth: 100,
  };
}
export function chipStyle(T, active, tint) {
  return {
    flexShrink: 0, minHeight: 40, padding: "0 14px", borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: BODY,
    border: `2px solid ${T.border}`,
    background: active ? (tint || T.accent) : T.bgElevated,
    color: active ? (tint ? T.onPastel : T.onAccent) : T.ink,
  };
}
export function tabBtnStyle(T, active) {
  return {
    flex: 1, minHeight: 40, padding: "0 10px", borderRadius: "12px 12px 0 0", border: `2px solid ${T.border}`, borderBottom: 0,
    cursor: "pointer", fontSize: 13.5, fontWeight: 800, fontFamily: BODY, background: active ? T.accent : T.sky,
    color: active ? T.onAccent : T.onPastel, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  };
}

/* ---------- small components ---------- */

export function Field({ T, label, children, style }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 11, fontWeight: 800, color: T.inkMuted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</label>
      {children}
    </div>
  );
}

// handwritten section heading with a dashed rule running off to the right
export function SectionTitle({ T, children, icon, color, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: HEAD, fontSize: 24, color: color || T.border, margin: "18px 0 10px", ...style }}>
      {icon}{children}
      <span style={{ flex: 1, borderTop: `2px dashed ${color || T.border}`, opacity: 0.6 }} />
    </div>
  );
}

// rotated "rubber stamp" status badge
export function Stamp({ T, kind, children }) {
  const bg = { active: T.mint, lifetime: T.lav, expiring: T.butter, expired: T.pink }[kind] || T.sky;
  return (
    <span style={{
      display: "inline-block", border: `2px solid ${T.border}`, borderRadius: 8, padding: "0 8px", fontFamily: HEAD, fontSize: 15,
      lineHeight: "20px", transform: "rotate(-2deg)", color: T.onPastel, background: bg, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// centered dialog: yellow header strip, paper body, hard shadow
export function Modal({ children, onClose, title, T, icon, z = 50 }) {
  return (
    <div className="nota-overlay" style={{ position: "fixed", inset: 0, background: T.overlay, display: "grid", placeItems: "center", padding: 12, zIndex: z }} onClick={onClose}>
      <div
        className="nota-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{ width: "min(460px, 100%)", maxHeight: "88vh", display: "flex", flexDirection: "column", background: T.bg, border: `2px solid ${T.border}`, borderRadius: 16, boxShadow: `5px 5px 0 ${T.border}`, overflow: "hidden" }}
      >
        <div style={{ background: T.hl, color: "#232B5E", borderBottom: `2px solid ${T.border}`, padding: "8px 8px 8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h3 style={{ fontFamily: HEAD, fontWeight: 400, fontSize: 25, margin: 0, display: "flex", alignItems: "center", gap: 8, lineHeight: 1.2 }}>{icon}{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ ...iconBtnStyle(T), width: 36, height: 36, color: T.ink }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "14px 14px 18px", flex: "1 1 auto" }}>{children}</div>
      </div>
    </div>
  );
}
