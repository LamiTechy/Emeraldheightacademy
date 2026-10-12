"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ScorePoint = { label: string; score: number; max: number };

const COLORS = [
  "#2F44E0",
  "#F59E0B",
  "#7C3AED",
  "#E11D48",
  "#0EA5E9",
  "#DB2777",
  "#4F46E5",
];

/** Score-trend chart: each test's earned marks vs max marks (bars). */
export function ScoreTrendChart({ points }: { points: ScorePoint[] }) {
  const data = points.map((p) => ({
    ...p,
    percent: p.max === 0 ? 0 : Math.round((p.score / p.max) * 100),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          interval={0}
          tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip
          formatter={(value, name) =>
            name === "percent" ? `${value}%` : value
          }
          labelFormatter={(label, payload) => {
            const p = payload?.[0]?.payload as { score: number; max: number } | undefined;
            return p ? `${label} — ${p.score}/${p.max} marks` : String(label);
          }}
        />
        <Bar dataKey="percent" name="Score" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Per-course average comparison (single bar per course). */
export function CourseAverageChart({
  points,
}: {
  points: { label: string; value: number | null }[];
}) {
  const data = points.filter((p) => p.value !== null).map((p) => ({ label: p.label, value: p.value }));
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="value" name="Average" fill="#2F44E0" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
