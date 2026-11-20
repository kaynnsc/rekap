import React, { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Moon, Sun, Lock, Loader2, LayoutDashboard, ReceiptText, Settings as SettingsIcon, Check, Menu, X, LogOut, NotebookText, DatabaseBackup, ArrowRight } from "lucide-react";
import Dashboard, { warrantyInfo } from "./Dashboard";
import OrdersPage from "./Orders";
import SettingsPage from "./Settings";
import { THEMES, globalCss, HEAD, BODY } from "./ui";

// Shares the admin password with the pricelist app — same Firestore project, same doc.
const AUTH_DOC_REF = doc(db, "pricelist", "main");
const DATA_DOC_REF = doc(db, "nota", "data");
const THEME_KEY = "nota-theme";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_SETTINGS = {
  platforms: [
    { id: uid(), label: "WA", color: "#22C55E" },
    { id: uid(), label: "Instagram", color: "#D946EF" },
    { id: uid(), label: "Telegram", color: "#38BDF8" },
  ],
  apps: [
    { id: uid(), label: "Netflix", color: "#DC2626" },
    { id: uid(), label: "Spotify", color: "#16A34A" },
    { id: uid(), label: "Alightmotion", color: "#EA580C" },
  ],
  plans: [
    { id: uid(), label: "Sharing" },
    { id: uid(), label: "Private" },
    { id: uid(), label: "Family" },
  ],
  durations: [
    { id: uid(), label: "1 Day", days: 1 },
    { id: uid(), label: "3 Days", days: 3 },
    { id: uid(), label: "1 Week", days: 7 },
    { id: uid(), label: "1 Month", days: 30 },
    { id: uid(), label: "3 Months", days: 90 },
    { id: uid(), label: "Lifetime", days: null },
  ],
  suppliers: [
    { id: uid(), label: "Premstore", contacts: [{ id: uid(), name: "Admin 1", contact: "+62 877-6777-7777" }] },
  ],
};

const DEFAULT_DATA = { settings: DEFAULT_SETTINGS, orders: [] };

// migrates suppliers from the old single-`contact` shape to the new `contacts` array shape
function migrateSuppliers(suppliers) {
  return (suppliers || []).map((s) => {
    if (Array.isArray(s.contacts)) return s;
    const legacyContact = s.contact;
    return {
      id: s.id,
      label: s.label,
      contacts: legacyContact ? [{ id: uid(), name: "Admin 1", contact: legacyContact }] : [],
    };
  });
}

// Login: a laptop sitting on the desk, with a lock-screen prompt on its display.
function LoginLaptop({ T, dark, setDark, pwInput, setPwInput, loginError, onLogin }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", placeItems: "center", padding: "24px 20px", fontFamily: BODY, overflow: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* lid + bezel */}
        <div style={{ position: "relative", background: T.border, border: `2px solid ${T.border}`, borderRadius: "18px 18px 4px 4px", padding: "16px 10px 12px", boxShadow: `4px 0 0 ${T.border}` }}>
          <span aria-hidden="true" style={{ position: "absolute", top: 6, left: "50%", width: 6, height: 6, marginLeft: -3, borderRadius: "50%", background: T.bdk }} />

          {/* screen */}
          <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", color: T.onPastel, background: `radial-gradient(rgba(255,255,255,.18) 1.5px, transparent 1.6px) 0 0 / 14px 14px, linear-gradient(160deg, ${T.sky}, ${T.lav})`, padding: "14px 16px 22px", minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>
              <span>Nota OS</span>
              <button
                onClick={() => setDark(!dark)} aria-label={dark ? "Light mode" : "Dark mode"}
                style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${T.border}`, background: T.bgElevated, color: T.ink, display: "grid", placeItems: "center", cursor: "pointer", padding: 0 }}
              >
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 6 }}>
              <div style={{ fontFamily: HEAD, fontSize: 52, lineHeight: 1 }}>{time}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>{date}</div>
            </div>

            <div style={{ width: 68, height: 68, borderRadius: "50%", background: T.hl, color: T.onHl, border: `2px solid ${T.border}`, boxShadow: `2px 2px 0 ${T.border}`, display: "grid", placeItems: "center", marginTop: 18 }}>
              <NotebookText size={30} />
            </div>
            <div style={{ fontFamily: HEAD, fontSize: 28, lineHeight: 1.1, marginTop: 8 }}>Nota Admin</div>

            <div className="nota-pill" style={{ display: "flex", alignItems: "center", gap: 6, width: "min(260px, 100%)", marginTop: 12, background: T.bgElevated, border: `2px solid ${T.border}`, borderRadius: 999, padding: "3px 3px 3px 16px", boxShadow: `3px 3px 0 ${T.border}` }}>
              <input className="nota-bare"
                type="password" autoFocus value={pwInput} aria-label="Password" placeholder="Enter password"
                onChange={(e) => setPwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLogin()}
                style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", color: T.ink, fontFamily: BODY, fontSize: 16, minHeight: 36 }}
              />
              <button
                onClick={onLogin} aria-label="Log in"
                style={{ width: 36, height: 36, borderRadius: "50%", border: 0, background: T.accent, color: T.onAccent, display: "grid", placeItems: "center", cursor: "pointer", flex: "none", padding: 0 }}
              >
                <ArrowRight size={18} />
              </button>
            </div>

            <div role="status" style={{ minHeight: 30, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              {loginError ? (
                <span style={{ background: T.pink, color: T.onPastel, border: `2px solid ${T.border}`, borderRadius: 8, padding: "1px 10px", fontSize: 12.5, fontWeight: 800 }}>{loginError}</span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>Same password as your pricelist site</span>
              )}
            </div>
          </div>
        </div>

        {/* hinge + keyboard deck */}
        <div aria-hidden="true" style={{ width: "106%", marginLeft: "-3%", height: 16, background: T.face, border: `2px solid ${T.border}`, borderRadius: "0 0 20px 20px", boxShadow: `4px 4px 0 ${T.border}`, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "22%", height: 6, background: T.bdk, borderRadius: "0 0 8px 8px" }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === "dark"; } catch (e) { return false; }
  });
  const [authPassword, setAuthPassword] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [data, setData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ordersFilterPreset, setOrdersFilterPreset] = useState(null);
  const [toast, setToast] = useState("");
  const editingRef = useRef(false);

  const T = dark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (e) {}
    document.body.style.background = T.desk;
    document.documentElement.style.background = T.desk;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#12141D" : "#232B5E");
  }, [dark, T.desk]);

  const flashToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const backupAll = async () => {
    try {
      const snap = await getDoc(DATA_DOC_REF);
      const backup = {
        type: "nota-backup",
        exportedAt: new Date().toISOString(),
        data: snap.exists() ? snap.data() : null,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nota-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flashToast("Backup downloaded");
    } catch (e) {
      flashToast("Backup failed — check your connection");
    }
  };

  const restoreFromBackupFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.type !== "nota-backup" || !parsed.data) {
          flashToast("That doesn't look like a nota backup file");
          return;
        }
        const confirmed = window.confirm(
          `This will REPLACE all current orders and settings with the backup from ${parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : "an unknown date"}. This can't be undone. Continue?`
        );
        if (!confirmed) return;
        await setDoc(DATA_DOC_REF, parsed.data);
        flashToast("Restored from backup");
      } catch (err) {
        flashToast("Couldn't read that backup file");
      }
    };
    reader.readAsText(file);
  };

  // watch the shared admin password
  useEffect(() => {
    const unsub = onSnapshot(AUTH_DOC_REF, (snap) => {
      setAuthPassword(snap.exists() ? snap.data().password || "admin123" : "admin123");
      setAuthLoaded(true);
    }, () => { setAuthPassword("admin123"); setAuthLoaded(true); });
    return () => unsub();
  }, []);

  // watch nota data — only actually needed once logged in, but cheap to keep subscribed
  useEffect(() => {
    const unsub = onSnapshot(DATA_DOC_REF, (snap) => {
      if (!snap.exists()) {
        setDoc(DATA_DOC_REF, DEFAULT_DATA).catch(() => {});
        setData(DEFAULT_DATA);
      } else if (!editingRef.current) {
        const d = snap.data();
        const mergedSettings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
        mergedSettings.suppliers = migrateSuppliers(mergedSettings.suppliers);
        setData({ settings: mergedSettings, orders: d.orders || [] });
      }
      setDataLoaded(true);
    }, () => { setData(DEFAULT_DATA); setDataLoaded(true); });
    return () => unsub();
  }, []);

  const persist = useCallback(async (next) => {
    setData(next);
    try { await setDoc(DATA_DOC_REF, next); } catch (e) { flashToast("Couldn't save — check your connection"); }
  }, []);

  const goToOrders = (filterPreset) => {
    setOrdersFilterPreset(filterPreset || null);
    setTab("orders");
  };

  const handleLogin = () => {
    if (pwInput === authPassword) { setIsLoggedIn(true); setPwInput(""); setLoginError(""); }
    else setLoginError("Incorrect password.");
  };

  const themeCss = <style>{globalCss(T)}</style>;
  const spinner = (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="animate-spin" color={T.accent} size={26} />
    </div>
  );

  if (!authLoaded) return <>{themeCss}{spinner}</>;

  if (!isLoggedIn) {
    return (
      <>
        {themeCss}
        <LoginLaptop T={T} dark={dark} setDark={setDark} pwInput={pwInput} setPwInput={setPwInput} loginError={loginError} onLogin={handleLogin} />
      </>
    );
  }

  if (!dataLoaded || !data) return <>{themeCss}{spinner}</>;

  const attentionCount = data.orders.filter((o) => {
    return warrantyInfo(o, data.settings).status === "expiring";
  }).length;

  const TABS = [
    { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard, badge: attentionCount },
    { key: "orders", label: "Orders", Icon: ReceiptText },
    { key: "settings", label: "Settings", Icon: SettingsIcon },
  ];

  const goTab = (key) => {
    if (key === "orders") setOrdersFilterPreset(null);
    setTab(key);
    window.scrollTo({ top: 0 });
  };

  const circleBtn = { width: 40, height: 40, borderRadius: "50%", border: 0, background: "transparent", color: T.ink, display: "grid", placeItems: "center", cursor: "pointer", flex: "none" };
  const toastBad = /couldn't|can't|failed|doesn't/i.test(toast);

  return (
    <>
      {themeCss}
      <div className="nota-app">
        <header className="nota-top">
          <button onClick={() => setSidebarOpen(true)} aria-label="Menu" style={circleBtn}><Menu size={19} /></button>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.hl, display: "grid", placeItems: "center", color: T.onHl, flex: "none" }}>
            <NotebookText size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ fontFamily: HEAD, fontSize: 28, lineHeight: 1, color: T.border }}>Nota</span>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: T.inkMuted, letterSpacing: ".08em", textTransform: "uppercase" }}>Admin Rekap</span>
          </div>
          <button onClick={() => setDark(!dark)} aria-label={dark ? "Light mode" : "Dark mode"} style={circleBtn}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main key={tab} className="nota-page">
          {tab === "dashboard" && <Dashboard T={T} data={data} onNavigate={goToOrders} />}
          {tab === "orders" && (
            <OrdersPage
              T={T}
              data={data}
              persist={persist}
              flashToast={flashToast}
              editingRef={editingRef}
              initialFilter={ordersFilterPreset}
              clearInitialFilter={() => setOrdersFilterPreset(null)}
            />
          )}
          {tab === "settings" && <SettingsPage T={T} data={data} persist={persist} authPassword={authPassword} flashToast={flashToast} editingRef={editingRef} backupAll={backupAll} restoreFromBackupFile={restoreFromBackupFile} />}
        </main>
      </div>

      <nav className="nota-nav" aria-label="Main">
        {TABS.map(({ key, label, Icon, badge }) => (
          <button key={key} aria-pressed={tab === key} onClick={() => goTab(key)}>
            <Icon size={20} />
            {label}
            {badge > 0 && <span className="nota-badge">{badge > 99 ? "99+" : badge}</span>}
          </button>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="nota-overlay" style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 40 }} onClick={() => setSidebarOpen(false)}>
          <div
            className="nota-sidebar" onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 270, maxWidth: "85vw", background: T.bg, borderRight: `2px solid ${T.border}`, boxShadow: `4px 0 0 ${T.border}`, padding: "calc(16px + env(safe-area-inset-top, 0px)) 16px 20px", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.hl, display: "grid", placeItems: "center", color: T.onHl }}>
                <NotebookText size={20} />
              </div>
              <span style={{ fontFamily: HEAD, fontSize: 30, lineHeight: 1, color: T.border }}>Nota</span>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ ...circleBtn, marginLeft: "auto" }}><X size={18} /></button>
            </div>

            <SidebarLink T={T} icon={dark ? <Sun size={17} /> : <Moon size={17} />} label={dark ? "Light mode" : "Dark mode"} onClick={() => setDark(!dark)} />
            <SidebarLink T={T} icon={<DatabaseBackup size={17} />} label="Download backup" onClick={() => { backupAll(); setSidebarOpen(false); }} />

            <div style={{ flex: 1 }} />
            <SidebarLink T={T} icon={<LogOut size={17} />} label="Log out" onClick={() => { setIsLoggedIn(false); setSidebarOpen(false); }} danger />
          </div>
        </div>
      )}

      {toast && (
        <div
          className="nota-toast" role="status"
          style={{ position: "fixed", bottom: "calc(100px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", width: "min(440px, calc(100% - 28px))", background: toastBad ? T.pink : T.bgElevated, color: toastBad ? T.onPastel : T.ink, border: `2px solid ${T.border}`, borderRadius: 16, padding: "10px 14px", boxShadow: T.shadow, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, zIndex: 45 }}
        >
          {!toastBad && <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.mint, color: T.onPastel, display: "grid", placeItems: "center", flex: "none", border: `2px solid ${T.border}` }}><Check size={12} strokeWidth={3} /></span>}
          {toast}
        </div>
      )}
    </>
  );
}

function SidebarLink({ T, icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 46, padding: "0 12px", borderRadius: 12,
        border: `2px solid ${T.border}`, cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: BODY, textAlign: "left",
        background: danger ? T.pink : T.bgElevated, color: danger ? T.onPastel : T.ink, marginBottom: 8,
      }}
    >
      {icon} {label}
    </button>
  );
}
