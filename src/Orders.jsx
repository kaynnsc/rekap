import React, { useState, useRef, useMemo, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Upload, Download, Sheet, Loader2, Search, ScanLine, ListChecks, SlidersHorizontal, BookUser } from "lucide-react";
import { uid } from "./App";
import { warrantyInfo, formatWarrantyCountdown } from "./Dashboard";
import ScannerModal from "./Scanner";
import PricelistPicker, { extractDurationDays, guessAppName } from "./PricelistPicker";
import { contactPickerSupported, pickContact } from "./webContacts";
import { HEAD, BODY, Modal, Field, Stamp, cardStyle, inputStyle, textareaStyle, primaryBtnStyle, secondaryBtnStyle, iconBtnStyle, ghostBtnStyle, iconOnlyBtn, filterSelectStyle, chipStyle } from "./ui";

function formatIDR(n) {
  const num = Number(n) || 0;
  return `Rp ${num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function emptyOrder() {
  return {
    id: uid(), date: new Date().toISOString().slice(0, 10), customer: "", platformId: "", contact: "",
    appId: "", planId: "", durationId: "", account: "", password: "", supplierId: "", supplierContactId: "", supplierContact: "",
    sellPrice: 0, costPrice: 0, notes: "",
  };
}

function parseCSV(text) {
  const delim = text.includes("\t") ? "\t" : ",";
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const splitLine = (line) => {
    if (delim === "\t") return line.split("\t");
    const out = []; let cur = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((l) => splitLine(l));
  return rows.map((r) => { const obj = {}; header.forEach((h, i) => (obj[h] = (r[i] || "").trim())); return obj; });
}

function findOrCreateOption(list, label, extra = {}) {
  if (!label) return { list, id: "" };
  const existing = list.find((o) => o.label.toLowerCase() === label.toLowerCase());
  if (existing) return { list, id: existing.id };
  const created = { id: uid(), label, ...extra };
  return { list: [...list, created], id: created.id };
}

export default function OrdersPage({ T, data, persist, flashToast, editingRef, initialFilter, clearInitialFilter }) {
  const { orders, settings } = data;
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [appFilter, setAppFilter] = useState("");
  const [warrantyFilter, setWarrantyFilter] = useState("all"); // all | active | expiring | expired | lifetime
  const [dateFilter, setDateFilter] = useState("all"); // all | today | month
  const [editingOrder, setEditingOrder] = useState(null); // order object being added/edited, or null
  const [viewingOrder, setViewingOrder] = useState(null); // order shown read-only, or null
  const [showImport, setShowImport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPricelistPicker, setShowPricelistPicker] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [importError, setImportError] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef(null);
  const [tick, setTick] = useState(0);

  // re-render every minute so hour-based warranty countdowns stay live
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // apply a filter preset coming from Dashboard shortcuts (e.g. "Active Warranty", a stat card, a reminder)
  useEffect(() => {
    if (!initialFilter) return;
    if (initialFilter.type === "search") setQuery(initialFilter.query || "");
    if (initialFilter.type === "warranty") { setWarrantyFilter("active"); setShowFilters(true); }
    if (initialFilter.type === "expired") { setWarrantyFilter("expired"); setShowFilters(true); }
    if (initialFilter.type === "today") setDateFilter("today");
    if (initialFilter.type === "month") setDateFilter("month");
    clearInitialFilter && clearInitialFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const filtered = useMemo(() => {
    return [...orders]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .filter((o) => !query.trim() || (o.customer + " " + o.account).toLowerCase().includes(query.toLowerCase()))
      .filter((o) => !appFilter || o.appId === appFilter)
      .filter((o) => {
        if (dateFilter === "all") return true;
        if (dateFilter === "today") return o.date === todayISO;
        if (dateFilter === "month") {
          const d = new Date(o.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      })
      .filter((o) => {
        if (warrantyFilter === "all") return true;
        const w = warrantyInfo(o, settings);
        if (warrantyFilter === "active") return w.status === "active" || w.status === "expiring" || w.status === "lifetime";
        return w.status === warrantyFilter;
      });
  }, [orders, query, appFilter, dateFilter, warrantyFilter, settings, todayISO, tick]);

  const hasActiveFilters = appFilter || warrantyFilter !== "all" || dateFilter !== "all";
  const clearAllFilters = () => { setAppFilter(""); setWarrantyFilter("all"); setDateFilter("all"); };

  const handlePricelistPick = (item) => {
    const guessedApp = guessAppName(item.name);
    let apps = settings.apps;
    let app = apps.find((a) => guessedApp.toLowerCase().includes(a.label.toLowerCase()) || a.label.toLowerCase().includes(guessedApp.toLowerCase()));
    if (!app) {
      app = { id: uid(), label: guessedApp, color: "#93AFC9" };
      apps = [...apps, app];
      persist({ ...data, settings: { ...settings, apps } });
    }
    const days = extractDurationDays(item.name) || extractDurationDays(item.unit);
    const duration = days ? settings.durations.find((d) => d.days === days) : null;

    setEditingOrder({
      ...emptyOrder(),
      appId: app.id,
      durationId: duration ? duration.id : "",
      sellPrice: Number(item.price) || 0,
      notes: item.description || "",
    });
    setShowPricelistPicker(false);
    flashToast("Pricelist item loaded — review and save");
  };

  const saveOrder = (order, newApp) => {
    const exists = orders.some((o) => o.id === order.id);
    const nextOrders = exists ? orders.map((o) => (o.id === order.id ? order : o)) : [...orders, order];
    const nextSettings = newApp ? { ...settings, apps: [...settings.apps, newApp] } : settings;
    persist({ ...data, settings: nextSettings, orders: nextOrders });
    setEditingOrder(null);
    flashToast(exists ? "Order updated" : "Order added");
  };

  const deleteOrder = (id) => {
    persist({ ...data, orders: orders.filter((o) => o.id !== id) });
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = orders.map((o) => ({
      "Tanggal Order": o.date,
      "Nama Customer": o.customer,
      "Kode": settings.platforms.find((p) => p.id === o.platformId)?.label || "",
      "Keterangan": o.contact,
      "Aplikasi": settings.apps.find((a) => a.id === o.appId)?.label || "",
      "Plan": settings.plans.find((p) => p.id === o.planId)?.label || "",
      "Durasi": settings.durations.find((d) => d.id === o.durationId)?.label || "",
      "Data Akun": o.account,
      "Password": o.password,
      "First Hand": settings.suppliers.find((s) => s.id === o.supplierId)?.label || "",
      "Contact FH": o.supplierContact,
      "Harga Jual": o.sellPrice,
      "Harga Beli": o.costPrice,
      "Keuntungan": (Number(o.sellPrice) || 0) - (Number(o.costPrice) || 0),
      "Catatan": o.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Order");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rekap-order.xlsx";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flashToast("Exported");
  };

  const rowsToOrders = (rows) => {
    let platforms = [...settings.platforms], apps = [...settings.apps], plans = [...settings.plans], suppliers = [...settings.suppliers];
    const newOrders = rows.map((row) => {
      const platformRes = findOrCreateOption(platforms, row["kode"] || row["platform"], { color: "#93AFC9" });
      platforms = platformRes.list;
      const appRes = findOrCreateOption(apps, row["aplikasi"] || row["app"], { color: "#93AFC9" });
      apps = appRes.list;
      const planRes = findOrCreateOption(plans, row["plan"]);
      plans = planRes.list;
      const supplierLabel = row["first hand"] || row["firsthand"] || row["supplier"] || "";
      let supplier = suppliers.find((s) => s.label.toLowerCase() === supplierLabel.toLowerCase());
      const fhContact = row["contact fh"] || "";
      if (supplierLabel && !supplier) {
        supplier = { id: uid(), label: supplierLabel, contacts: fhContact ? [{ id: uid(), name: "Admin 1", contact: fhContact }] : [] };
        suppliers = [...suppliers, supplier];
      }
      const supplierId = supplier ? supplier.id : "";
      const matchedContact = supplier && fhContact ? supplier.contacts.find((c) => c.contact === fhContact) : null;
      const durationLabel = row["durasi"] || row["duration"] || "";
      let duration = settings.durations.find((d) => d.label.toLowerCase() === durationLabel.toLowerCase());
      const durationId = duration ? duration.id : "";
      return {
        id: uid(),
        date: row["tanggal order"] || row["date"] || new Date().toISOString().slice(0, 10),
        customer: row["nama customer"] || row["customer"] || "",
        platformId: platformRes.id,
        contact: row["keterangan"] || row["contact"] || "",
        appId: appRes.id,
        planId: planRes.id,
        durationId,
        account: row["data akun"] || row["account"] || "",
        password: row["password"] || "",
        supplierId,
        supplierContactId: matchedContact ? matchedContact.id : "",
        supplierContact: fhContact,
        sellPrice: parseFloat(row["harga jual"] || row["sell price"] || 0) || 0,
        costPrice: parseFloat(row["harga beli"] || row["cost price"] || 0) || 0,
        notes: row["catatan"] || row["notes"] || "",
      };
    });
    return { newOrders, platforms, apps, plans, suppliers };
  };

  const applyImport = (rows) => {
    if (rows.length === 0) { setImportError("No recognizable rows found."); return; }
    const { newOrders, platforms, apps, plans, suppliers } = rowsToOrders(rows);
    persist({ settings: { ...settings, platforms, apps, plans, suppliers }, orders: [...orders, ...newOrders] });
    setShowImport(false);
    flashToast(`Imported ${newOrders.length} orders`);
  };

  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportBusy(true); setImportError("");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const normalized = rows.map((r) => { const lower = {}; Object.keys(r).forEach((k) => (lower[k.toLowerCase()] = String(r[k]))); return lower; });
        applyImport(normalized);
      } catch (err) { setImportError("Couldn't read that file."); }
      finally { setImportBusy(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  const importFromUrl = async () => {
    if (!sheetUrl.trim()) return;
    setImportBusy(true); setImportError("");
    try {
      const res = await fetch(sheetUrl.trim());
      if (!res.ok) throw new Error("bad response");
      const text = await res.text();
      applyImport(parseCSV(text));
    } catch (err) { setImportError("Couldn't fetch that link. Try pasting cells instead."); }
    finally { setImportBusy(false); }
  };

  const importFromPaste = () => {
    if (!pasteText.trim()) return;
    applyImport(parseCSV(pasteText.trim()));
    setPasteText("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div className="nota-pill" style={{ display: "flex", alignItems: "center", gap: 8, background: T.bgElevated, border: `2px solid ${T.border}`, borderRadius: 999, padding: "0 14px", minHeight: 44, flex: 1, minWidth: 0 }}>
          <Search size={16} color={T.inkMuted} />
          <input className="nota-bare" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders" aria-label="Search orders" style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0, fontSize: 16, color: T.ink, fontFamily: BODY }} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={iconOnlyBtn(T, hasActiveFilters)}
          aria-label="Filter" aria-pressed={showFilters}
          title="Filter"
        >
          <SlidersHorizontal size={16} />
          {hasActiveFilters && <span style={{ position: "absolute", top: -5, right: -5, width: 13, height: 13, borderRadius: "50%", background: T.margin, border: `2px solid ${T.bgElevated}` }} />}
        </button>
        <button onClick={() => setShowImport(true)} style={iconOnlyBtn(T)} aria-label="Import" title="Import"><Upload size={16} /></button>
        <button onClick={exportExcel} style={iconOnlyBtn(T)} aria-label="Export" title="Export"><Download size={16} /></button>
      </div>

      {/* Warranty status — always visible, not tucked behind the filter panel */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", scrollbarWidth: "none", padding: "2px 2px 4px" }}>
        {[
          { key: "active", label: `Active (${orders.filter((o) => { const s = warrantyInfo(o, settings).status; return s === "active" || s === "expiring" || s === "lifetime"; }).length})`, tint: T.mint },
          { key: "expiring", label: `Expiring (${orders.filter((o) => warrantyInfo(o, settings).status === "expiring").length})`, tint: T.butter },
          { key: "expired", label: `Expired (${orders.filter((o) => warrantyInfo(o, settings).status === "expired").length})`, tint: T.pink },
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setWarrantyFilter(warrantyFilter === chip.key ? "all" : chip.key)}
            aria-pressed={warrantyFilter === chip.key}
            style={chipStyle(T, warrantyFilter === chip.key, chip.tint)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div style={{ ...cardStyle(T, { borderRadius: 12 }), padding: 12, marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} style={filterSelectStyle(T)}>
              <option value="">All apps</option>
              {settings.apps.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <select value={warrantyFilter} onChange={(e) => setWarrantyFilter(e.target.value)} style={filterSelectStyle(T)}>
              <option value="all">All warranty</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
              <option value="lifetime">Lifetime</option>
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={filterSelectStyle(T)}>
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="month">This month</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} style={{ alignSelf: "flex-start", background: "none", border: "none", color: T.negative, fontSize: 13, fontWeight: 800, cursor: "pointer", padding: 0, fontFamily: BODY }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => setEditingOrder(emptyOrder())} style={{ ...primaryBtnStyle(T), flex: "0.8 1 0", padding: "0 8px", fontSize: 13.5 }}>
          <Plus size={14} /> Add
        </button>
        <button onClick={() => setShowPricelistPicker(true)} style={{ ...secondaryBtnStyle(T), flex: "1.6 1 0", padding: "0 8px", fontSize: 13.5, whiteSpace: "nowrap" }}>
          <ListChecks size={14} /> From pricelist
        </button>
        <button onClick={() => setShowScanner(true)} style={{ ...secondaryBtnStyle(T), flex: 1, padding: "0 8px", fontSize: 13.5 }}>
          <ScanLine size={14} /> Scan
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", color: T.inkMuted, fontFamily: HEAD, fontSize: 24, padding: "24px 0" }}>No orders yet.</div>}
        {filtered.map((o) => {
          const app = settings.apps.find((a) => a.id === o.appId);
          const profit = (Number(o.sellPrice) || 0) - (Number(o.costPrice) || 0);
          const w = warrantyInfo(o, settings);
          return (
            <div
              key={o.id}
              className="nota-row"
              onClick={() => setViewingOrder(o)}
              style={{ ...cardStyle(T, { borderRadius: 12, boxShadow: "2px 2px 0 " + T.border }), padding: 10, display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${T.border}`, background: app?.color || T.inkFaint, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 22, flexShrink: 0 }}>
                {(app?.label || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.customer || "Unnamed"}</span>
                  <span style={{ fontFamily: HEAD, fontSize: 19, lineHeight: 1.2, color: T.positive, whiteSpace: "nowrap" }}>+{formatIDR(profit)}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.inkMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>{app?.label || "—"} · {o.date}</span>
                  {(w.status === "expired" || w.status === "expiring") && <Stamp T={T} kind={w.status}>{formatWarrantyCountdown(w)}</Stamp>}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }} style={{ ...iconBtnStyle(T), color: T.negative }} aria-label="Delete order"><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>

      {editingOrder && (
        <OrderForm T={T} order={editingOrder} settings={settings} isNew={!orders.some((o) => o.id === editingOrder.id)} onSave={saveOrder} onClose={() => setEditingOrder(null)} editingRef={editingRef} />
      )}

      {viewingOrder && (
        <OrderView
          T={T}
          order={orders.find((o) => o.id === viewingOrder.id) || viewingOrder}
          settings={settings}
          onEdit={(o) => { setViewingOrder(null); setEditingOrder(o); }}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {showPricelistPicker && (
        <PricelistPicker T={T} settings={settings} onClose={() => setShowPricelistPicker(false)} onPick={handlePricelistPick} />
      )}

      {showScanner && (
        <ScannerModal
          T={T}
          settings={settings}
          onClose={() => setShowScanner(false)}
          onApply={(matched) => {
            const base = emptyOrder();
            const clean = {};
            Object.keys(matched).forEach((k) => { if (!k.endsWith("_label")) clean[k] = matched[k]; });
            setEditingOrder({ ...base, ...clean });
            setShowScanner(false);
            flashToast("Scanned data loaded — review and save");
          }}
        />
      )}

      {showImport && (
        <Modal T={T} title="Import orders" onClose={() => { setShowImport(false); setImportError(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>From Excel or CSV file</div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelFile} style={{ fontSize: 13, color: T.ink }} />
            </div>
            <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Sheet size={13} /> From a public Google Sheet</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="Published CSV link" style={{ ...inputStyle(T), flex: 1 }} />
                <button onClick={importFromUrl} disabled={importBusy} style={primaryBtnStyle(T)}>{importBusy ? <Loader2 size={14} className="animate-spin" /> : "Fetch"}</button>
              </div>
            </div>
            <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Or paste cells directly</div>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={5} placeholder={"Tanggal Order\tNama Customer\tKode\tAplikasi\tPlan\tDurasi\tHarga Jual\tHarga Beli"} style={{ ...textareaStyle(T), fontFamily: "monospace", fontSize: 12 }} />
              <button onClick={importFromPaste} style={{ ...primaryBtnStyle(T), marginTop: 8 }}>Import pasted data</button>
            </div>
            {importError && <p style={{ color: T.onPastel, fontSize: 13, fontWeight: 700, background: T.dangerSoft, border: `2px solid ${T.border}`, padding: "6px 10px", borderRadius: 8, margin: 0 }}>{importError}</p>}
            <p style={{ fontSize: 11, color: T.inkFaint }}>
              Columns matching your sheet: Tanggal Order, Nama Customer, Kode, Keterangan, Aplikasi, Plan, Durasi, Data Akun, Password, First Hand, Contact FH, Harga Jual, Harga Beli, Catatan.
              New platforms/apps/plans/suppliers found in the file are added to your dropdown lists automatically.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

const APP_COLORS = ["#E5484D", "#F76B15", "#30A46C", "#3E63DD", "#8E4EC6", "#12A594", "#D6409F", "#978365"];

const smallLabel = (T) => ({ fontSize: 11, fontWeight: 800, color: T.inkMuted, textTransform: "uppercase", letterSpacing: ".06em" });

// A field the user can remove again (clears its value).
function OptionalField({ T, label, onRemove, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={smallLabel(T)}>{label}</label>
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} style={{ display: "flex", alignItems: "center", gap: 2, border: 0, background: "transparent", color: T.negative, fontSize: 12, fontWeight: 800, cursor: "pointer", padding: 0, fontFamily: BODY }}>
          <X size={12} /> Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function OrderForm({ T, order, settings, isNew, onSave, onClose, editingRef }) {
  const [form, setForm] = useState(order);
  // Application is free text: pick a suggestion or type a new name.
  const [appText, setAppText] = useState(() => settings.apps.find((a) => a.id === order.appId)?.label || "");
  // Optional fields start open only when the order already has a value for them.
  const [extras, setExtras] = useState(() => ({
    platform: !!order.platformId,
    contact: !!order.contact,
    plan: !!order.planId,
    supplier: !!(order.supplierId || order.supplierContactId || order.supplierContact),
    notes: !!order.notes,
  }));

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const openExtra = (k) => setExtras((x) => ({ ...x, [k]: true }));
  const closeExtra = (k) => {
    setExtras((x) => ({ ...x, [k]: false }));
    const cleared = {
      platform: { platformId: "" },
      contact: { contact: "" },
      plan: { planId: "" },
      supplier: { supplierId: "", supplierContactId: "", supplierContact: "" },
      notes: { notes: "" },
    }[k];
    set(cleared);
  };

  const onSupplierChange = (supplierId) => {
    const supplier = settings.suppliers.find((s) => s.id === supplierId);
    const firstContact = supplier?.contacts?.[0];
    set({ supplierId, supplierContactId: firstContact ? firstContact.id : "", supplierContact: firstContact ? firstContact.contact : "" });
  };

  const onSupplierContactChange = (contactId) => {
    const supplier = settings.suppliers.find((s) => s.id === form.supplierId);
    const contact = supplier?.contacts?.find((c) => c.id === contactId);
    set({ supplierContactId: contactId, supplierContact: contact ? contact.contact : form.supplierContact });
  };

  const selectedSupplier = settings.suppliers.find((s) => s.id === form.supplierId);
  const profit = (Number(form.sellPrice) || 0) - (Number(form.costPrice) || 0);

  const typedApp = appText.trim();
  const matchedApp = typedApp ? settings.apps.find((a) => a.label.trim().toLowerCase() === typedApp.toLowerCase()) : null;

  const submit = () => {
    let appId = "";
    let newApp = null;
    if (typedApp) {
      if (matchedApp) appId = matchedApp.id;
      else {
        newApp = { id: uid(), label: typedApp, color: APP_COLORS[Math.floor(Math.random() * APP_COLORS.length)] };
        appId = newApp.id;
      }
    }
    onSave({ ...form, appId }, newApp);
  };

  const optionalList = [["platform", "Kode"], ["contact", "Keterangan"], ["plan", "Plan"], ["supplier", "First hand"], ["notes", "Catatan"]];
  const closedOptional = optionalList.filter(([k]) => !extras[k]);

  return (
    <Modal T={T} title={isNew ? "New order" : "Edit order"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }} onFocus={() => (editingRef.current = true)} onBlur={() => (editingRef.current = false)}>
        <Field T={T} label="Tanggal order">
          <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} style={inputStyle(T)} />
        </Field>
        <Field T={T} label="Nama customer">
          <div style={{ display: "flex", gap: 6 }}>
            <input value={form.customer} onChange={(e) => set({ customer: e.target.value })} style={{ ...inputStyle(T), flex: 1 }} placeholder="Customer name" />
            {contactPickerSupported() && (
              <button
                type="button"
                onClick={async () => {
                  const contact = await pickContact();
                  if (contact) {
                    set({ customer: contact.name || form.customer, contact: contact.phone || form.contact });
                    if (contact.phone) openExtra("contact");
                  }
                }}
                style={contactPickBtnStyle(T)}
                title="Pick from contacts"
              >
                <BookUser size={18} />
              </button>
            )}
          </div>
        </Field>
        <Field T={T} label="Aplikasi">
          <input
            list="nota-apps" value={appText} onChange={(e) => setAppText(e.target.value)}
            style={inputStyle(T)} placeholder="Type or pick an app" autoComplete="off"
          />
          <datalist id="nota-apps">
            {settings.apps.map((a) => <option key={a.id} value={a.label} />)}
          </datalist>
          {typedApp && !matchedApp && (
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginTop: 4 }}>New app “{typedApp}” will be added to your list.</div>
          )}
        </Field>
        <Field T={T} label="Durasi">
          <select value={form.durationId} onChange={(e) => set({ durationId: e.target.value })} style={inputStyle(T)}>
            <option value="">— pilih —</option>
            {settings.durations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </Field>
        <Field T={T} label="Data akun">
          <input value={form.account} onChange={(e) => set({ account: e.target.value })} style={inputStyle(T)} placeholder="email@..." />
        </Field>
        <Field T={T} label="Password">
          <input value={form.password} onChange={(e) => set({ password: e.target.value })} style={inputStyle(T)} />
        </Field>
        <div style={{ display: "flex", gap: 8 }}>
          <Field T={T} label="Harga jual" style={{ flex: 1 }}>
            <input type="number" value={form.sellPrice} onChange={(e) => set({ sellPrice: parseFloat(e.target.value) || 0 })} style={inputStyle(T)} />
          </Field>
          <Field T={T} label="Harga beli" style={{ flex: 1 }}>
            <input type="number" value={form.costPrice} onChange={(e) => set({ costPrice: parseFloat(e.target.value) || 0 })} style={inputStyle(T)} />
          </Field>
        </div>
        <div style={{ background: T.butter, border: `2px dashed ${T.border}`, borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.onPastel }}>Keuntungan (auto)</span>
          <span style={{ fontFamily: HEAD, fontSize: 24, color: profit >= 0 ? T.positive : T.negative }}>Rp {profit.toLocaleString("id-ID")}</span>
        </div>

        {/* ---- optional fields: added with a toggle, removed again with "Remove" ---- */}
        {extras.platform && (
          <OptionalField T={T} label="Kode (platform order masuk)" onRemove={() => closeExtra("platform")}>
            <select value={form.platformId} onChange={(e) => set({ platformId: e.target.value })} style={inputStyle(T)}>
              <option value="">— pilih —</option>
              {settings.platforms.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </OptionalField>
        )}
        {extras.contact && (
          <OptionalField T={T} label="Keterangan (kontak customer)" onRemove={() => closeExtra("contact")}>
            <input value={form.contact} onChange={(e) => set({ contact: e.target.value })} style={inputStyle(T)} placeholder="+62..." />
          </OptionalField>
        )}
        {extras.plan && (
          <OptionalField T={T} label="Plan" onRemove={() => closeExtra("plan")}>
            <select value={form.planId} onChange={(e) => set({ planId: e.target.value })} style={inputStyle(T)}>
              <option value="">— pilih —</option>
              {settings.plans.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </OptionalField>
        )}
        {extras.supplier && (
          <OptionalField T={T} label="First hand (supplier)" onRemove={() => closeExtra("supplier")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <select value={form.supplierId} onChange={(e) => onSupplierChange(e.target.value)} style={inputStyle(T)}>
                <option value="">— pilih —</option>
                {settings.suppliers.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {selectedSupplier && selectedSupplier.contacts && selectedSupplier.contacts.length > 0 && (
                <select value={form.supplierContactId || ""} onChange={(e) => onSupplierContactChange(e.target.value)} style={inputStyle(T)} aria-label="Admin / contact person">
                  <option value="">— admin / contact person —</option>
                  {selectedSupplier.contacts.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.contact}</option>)}
                </select>
              )}
              <input value={form.supplierContact} onChange={(e) => set({ supplierContact: e.target.value })} style={inputStyle(T)} placeholder="Contact FH" aria-label="Contact FH" />
            </div>
          </OptionalField>
        )}
        {extras.notes && (
          <OptionalField T={T} label="Catatan" onRemove={() => closeExtra("notes")}>
            <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} style={{ ...textareaStyle(T), minHeight: 64 }} />
          </OptionalField>
        )}

        {closedOptional.length > 0 && (
          <div>
            <div style={{ ...smallLabel(T), marginBottom: 6 }}>Optional</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {closedOptional.map(([k, label]) => (
                <button key={k} type="button" onClick={() => openExtra(k)} style={{ ...ghostBtnStyle(T), minHeight: 36, padding: "0 12px", borderRadius: 999 }}>
                  <Plus size={13} /> {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={submit} style={{ ...primaryBtnStyle(T), marginTop: 6 }}>Save order</button>
      </div>
    </Modal>
  );
}

// Read-only view of an order; editing only starts when "Edit" is pressed.
function OrderView({ T, order, settings, onEdit, onClose }) {
  const app = settings.apps.find((a) => a.id === order.appId);
  const w = warrantyInfo(order, settings);
  const platform = settings.platforms.find((p) => p.id === order.platformId)?.label;
  const plan = settings.plans.find((p) => p.id === order.planId)?.label;
  const duration = settings.durations.find((d) => d.id === order.durationId)?.label;
  const supplier = settings.suppliers.find((s) => s.id === order.supplierId);
  const contactPerson = supplier?.contacts?.find((c) => c.id === order.supplierContactId);
  const sell = Number(order.sellPrice) || 0;
  const cost = Number(order.costPrice) || 0;
  const profit = sell - cost;

  const rows = [
    ["Tanggal order", order.date],
    ["Aplikasi", app?.label],
    ["Plan", plan],
    ["Durasi", duration],
    ["Kode", platform],
    ["Keterangan", order.contact],
    ["Data akun", order.account],
    ["Password", order.password],
    ["First hand", supplier?.label],
    ["Admin / contact person", contactPerson ? `${contactPerson.name} — ${contactPerson.contact}` : ""],
    ["Contact FH", order.supplierContact],
  ].filter(([, v]) => v);

  return (
    <Modal T={T} title="Order details" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, border: `2px solid ${T.border}`, background: app?.color || T.inkFaint, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 26, flexShrink: 0 }}>
          {(app?.label || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, overflowWrap: "anywhere" }}>{order.customer || "Unnamed"}</div>
          <div style={{ marginTop: 3 }}><Stamp T={T} kind={w.status}>{formatWarrantyCountdown(w)}</Stamp></div>
        </div>
        <button onClick={() => onEdit(order)} style={{ ...primaryBtnStyle(T), minHeight: 40, padding: "0 14px", flexShrink: 0 }}>
          <Pencil size={14} /> Edit
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ padding: "8px 0", borderBottom: `2px dotted ${T.cardBorder}` }}>
            <div style={smallLabel(T)}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, overflowWrap: "anywhere", marginTop: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <div style={{ flex: 1, ...cardStyle(T, { borderRadius: 10, boxShadow: "none" }), padding: "8px 10px" }}>
          <div style={smallLabel(T)}>Harga jual</div>
          <div style={{ fontFamily: HEAD, fontSize: 20 }}>{formatIDR(sell)}</div>
        </div>
        <div style={{ flex: 1, ...cardStyle(T, { borderRadius: 10, boxShadow: "none" }), padding: "8px 10px" }}>
          <div style={smallLabel(T)}>Harga beli</div>
          <div style={{ fontFamily: HEAD, fontSize: 20 }}>{formatIDR(cost)}</div>
        </div>
      </div>
      <div style={{ background: T.butter, border: `2px dashed ${T.border}`, borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: T.onPastel }}>Keuntungan</span>
        <span style={{ fontFamily: HEAD, fontSize: 24, color: profit >= 0 ? T.positive : T.negative }}>{formatIDR(profit)}</span>
      </div>

      {order.notes && (
        <div style={{ marginTop: 12 }}>
          <div style={smallLabel(T)}>Catatan</div>
          <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginTop: 2 }}>{order.notes}</div>
        </div>
      )}

    </Modal>
  );
}

function contactPickBtnStyle(T) {
  return { display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, border: `2px solid ${T.border}`, background: T.bgElevated, color: T.ink, cursor: "pointer", flexShrink: 0 };
}
