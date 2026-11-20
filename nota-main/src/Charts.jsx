import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { HEAD, cardStyle } from "./ui";

function formatIDR(n) {
  const num = Number(n) || 0;
  return `Rp ${num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Charts({ T, last7DaysChart, appDistribution }) {
  const chartTitle = { fontFamily: HEAD, fontSize: 22, lineHeight: 1.1, color: T.border, padding: "0 8px 6px" };
  return (
    <>
      <div style={{ ...cardStyle(T), borderRadius: 16, padding: "14px 12px", marginBottom: 18 }}>
        <div style={chartTitle}>Profit — last 7 days</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={last7DaysChart}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: T.inkMuted }} axisLine={{ stroke: T.border, strokeWidth: 2 }} tickLine={false} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: T.rule, opacity: 0.6 }}
              formatter={(v) => formatIDR(v)}
              contentStyle={{ background: T.bgElevated, border: `2px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontWeight: 700, boxShadow: T.shadow }}
              labelStyle={{ color: T.ink, fontWeight: 800 }}
              itemStyle={{ color: T.ink }}
            />
            <Bar dataKey="profit" fill={T.hl} stroke={T.border} strokeWidth={2} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {appDistribution.length > 0 && (
        <div style={{ ...cardStyle(T), borderRadius: 16, padding: "14px 12px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={appDistribution} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50} paddingAngle={2} stroke={T.border} strokeWidth={2}>
                {appDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ ...chartTitle, padding: 0, marginBottom: 2 }}>Orders by app</div>
            {appDistribution.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: d.color, border: `2px solid ${T.border}`, flexShrink: 0 }} />
                <span style={{ color: T.ink, overflowWrap: "anywhere" }}>{d.name}</span>
                <span style={{ color: T.inkMuted, marginLeft: "auto" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
