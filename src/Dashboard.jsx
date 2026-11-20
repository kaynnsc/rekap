import React, { useMemo, useState, useEffect, Suspense, lazy } from "react";
import { ShoppingCart, ShieldCheck, Wallet, TrendingUp, AlertTriangle, Search } from "lucide-react";
import { HEAD, BODY, cardStyle, SectionTitle, Stamp } from "./ui";

const Charts = lazy(() => import("./Charts"));

function formatIDR(n) {
  const num = Number(n) || 0;
  return `Rp ${num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Warranty expiry is computed as exactly (duration.days * 24) hours after
// midnight of the order date — that gives a well-defined moment in time,
// so countdowns can be precise to the hour rather than only whole days.
export function warrantyInfo(order, settings) {
  const duration = settings.durations.find((d) => d.id === order.durationId);
  if (!duration || duration.days == null) return { status: "lifetime", hoursLeft: null };
  const orderDate = new Date(order.date);
  if (isNaN(orderDate.getTime())) return { status: "lifetime", hoursLeft: null };
  orderDate.setHours(0, 0, 0, 0);
  const expiry = new Date(orderDate);
  expiry.setDate(expiry.getDate() + duration.days);

  const now = Date.now();
  const hoursLeft = Math.floor((expiry.getTime() - now) / (1000 * 60 * 60));
  const daysLeft = Math.ceil((expiry.getTime() - now) / (1000 * 60 * 60 * 24));

  if (hoursLeft < 0) return { status: "expired", hoursLeft, daysLeft, expiry };
  if (hoursLeft <= 48) return { status: "expiring", hoursLeft, daysLeft, expiry };
  return { status: "active", hoursLeft, daysLeft, expiry };
}

// Turns an hoursLeft value into a short, human countdown — hour-precise once
// it's inside the last day, otherwise rounds to whole days.
export function formatWarrantyCountdown(w) {
  if (!w || w.hoursLeft == null) return "Lifetime";
  const h = w.hoursLeft;
  if (h < 0) {
    const abs = Math.abs(h);
    return abs < 24 ? `Expired ${abs}h ago` : `Expired ${Math.floor(abs / 24)}d ago`;
  }
  if (h === 0) return "Expires this hour";
  if (h < 24) return `${h}h left`;
  const days = Math.floor(h / 24);
  const hours = h % 24;
  return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
}

export default function Dashboard({ T, data, onNavigate }) {
  const { orders, settings } = data;
  const [searchInput, setSearchInput] = useState("");
  const [tick, setTick] = useState(0);

  // re-render every minute so hour-based warranty countdowns stay live without needing a manual refresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const runSearch = () => {
    if (searchInput.trim()) onNavigate({ type: "search", query: searchInput.trim() });
  };

  const stats = useMemo(() => {
    const today = todayISO();
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let todaysProfit = 0, monthlyProfit = 0, totalProfit = 0, totalRevenue = 0, activeWarranty = 0, expiredWarranty = 0;
    orders.forEach((o) => {
      const profit = (Number(o.sellPrice) || 0) - (Number(o.costPrice) || 0);
      totalProfit += profit;
      totalRevenue += Number(o.sellPrice) || 0;
      if (o.date === today) todaysProfit += profit;
      const d = new Date(o.date);
      if (d.getMonth() === month && d.getFullYear() === year) monthlyProfit += profit;
      const w = warrantyInfo(o, settings);
      if (w.status === "active" || w.status === "expiring" || w.status === "lifetime") activeWarranty++;
      if (w.status === "expired") expiredWarranty++;
    });

    return { totalOrders: orders.length, activeWarranty, expiredWarranty, todaysProfit, monthlyProfit, totalProfit, totalRevenue };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, settings, tick]);

  const reminders = useMemo(() => {
    return orders
      .map((o) => ({ o, w: warrantyInfo(o, settings) }))
      .filter(({ w }) => w.status === "expiring")
      .sort((a, b) => a.w.hoursLeft - b.w.hoursLeft)
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, settings, tick]);

  const last7DaysChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("id-ID", { weekday: "short" });
      const profit = orders.filter((o) => o.date === iso).reduce((sum, o) => sum + ((Number(o.sellPrice) || 0) - (Number(o.costPrice) || 0)), 0);
      days.push({ label, profit });
    }
    return days;
  }, [orders]);

  const appDistribution = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      const app = settings.apps.find((a) => a.id === o.appId);
      const label = app ? app.label : "Other";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => {
      const app = settings.apps.find((a) => a.label === name);
      return { name, value, color: app ? app.color : "#93AFC9" };
    });
  }, [orders, settings]);

  return (
    <div>
      <div className="nota-cover" style={{ marginTop: 6, paddingTop: 34 }}>
        <span className="nota-tag">TODAY</span>
        <div className="nota-label">
          <small>Today's profit</small>
          <h1><u>{formatIDR(stats.todaysProfit)}</u></h1>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 13, opacity: 0.92 }}>
          {stats.totalOrders} orders · {formatIDR(stats.monthlyProfit)} profit this month
        </p>
      </div>

      <div className="nota-pill" style={{ display: "flex", alignItems: "center", gap: 8, background: T.bgElevated, border: `2px solid ${T.border}`, borderRadius: 999, padding: "0 16px", minHeight: 46, margin: "20px 0 12px", boxShadow: T.shadow }}>
        <Search size={16} color={T.inkMuted} />
        <input className="nota-bare"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search orders, customers"
          aria-label="Search orders"
          style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0, fontSize: 16, color: T.ink, fontFamily: BODY }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => onNavigate({ type: "warranty" })}
          style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.mint, border: `2px solid ${T.border}`, borderRadius: 12, cursor: "pointer", padding: "0 12px", minHeight: 44, fontFamily: BODY, color: T.onPastel, boxShadow: "2px 2px 0 " + T.border }}
        >
          <span style={{ fontSize: 13, fontWeight: 800 }}>Active</span>
          <span style={{ fontFamily: HEAD, fontSize: 22 }}>{stats.activeWarranty}</span>
        </button>
        <button
          onClick={() => onNavigate({ type: "expired" })}
          style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.pink, border: `2px solid ${T.border}`, borderRadius: 12, cursor: "pointer", padding: "0 12px", minHeight: 44, fontFamily: BODY, color: T.onPastel, boxShadow: "2px 2px 0 " + T.border }}
        >
          <span style={{ fontSize: 13, fontWeight: 800 }}>Expired</span>
          <span style={{ fontFamily: HEAD, fontSize: 22 }}>{stats.expiredWarranty}</span>
        </button>
      </div>

      {reminders.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionTitle T={T} color={T.negative} icon={<AlertTriangle size={18} />} style={{ marginTop: 6 }}>
            Needs attention ({reminders.length})
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reminders.map(({ o, w }) => (
              <div
                key={o.id}
                onClick={() => onNavigate({ type: "search", query: o.customer })}
                style={{ ...cardStyle(T, { background: T.dangerSoft, borderRadius: 12, boxShadow: "2px 2px 0 " + T.border }), padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: T.onPastel, overflowWrap: "anywhere" }}>{o.customer}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.onPastel, opacity: 0.8 }}>{settings.apps.find((a) => a.id === o.appId)?.label || "—"}</div>
                </div>
                <Stamp T={T} kind={w.status}>{formatWarrantyCountdown(w)}</Stamp>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <StatCard T={T} bg={T.sky} icon={<ShoppingCart size={18} />} label="Total orders" value={stats.totalOrders} color={T.accent} onClick={() => onNavigate(null)} />
        <StatCard T={T} bg={T.mint} icon={<ShieldCheck size={18} />} label="Active warranty" value={stats.activeWarranty} color={T.positive} onClick={() => onNavigate({ type: "warranty" })} />
        <StatCard T={T} bg={T.butter} icon={<Wallet size={18} />} label="Today's profit" value={formatIDR(stats.todaysProfit)} color={T.accent} onClick={() => onNavigate({ type: "today" })} />
        <StatCard T={T} bg={T.peach} icon={<TrendingUp size={18} />} label="Monthly profit" value={formatIDR(stats.monthlyProfit)} color={T.positive} onClick={() => onNavigate({ type: "month" })} />
      </div>

      <Suspense fallback={<div style={{ height: 160, marginBottom: 16 }} />}>
        <Charts T={T} last7DaysChart={last7DaysChart} appDistribution={appDistribution} />
      </Suspense>

      <div style={{ fontSize: 12, fontWeight: 800, color: T.inkMuted, textAlign: "center", padding: "8px 0 20px" }}>
        All totals above are calculated automatically from your order list.
      </div>
    </div>
  );
}

function StatCard({ T, icon, label, value, color, onClick, bg }) {
  return (
    <button
      onClick={onClick}
      style={{ ...cardStyle(T, { background: bg || T.bgElevated }), padding: 12, cursor: onClick ? "pointer" : "default", textAlign: "left", fontFamily: BODY, color: T.onPastel, minWidth: 0 }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: T.bgElevated, border: `2px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 8 }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: HEAD, fontSize: 28, lineHeight: 1.1, marginTop: 2, overflowWrap: "anywhere" }}>{value}</div>
    </button>
  );
}
