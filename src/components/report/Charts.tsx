"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, CHART_TOOLTIP_STYLE } from "./ChartCard";
import type { RatingBucket, ThemeShare, OneStarDriver } from "@/lib/report-stats";
import type { WeekBucket } from "@/lib/weeks";

const AXIS_PROPS = {
  stroke: "var(--border)",
  tick: { fill: "var(--foreground-muted)", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
};

const GRID_PROPS = { stroke: "var(--border)", vertical: false };

export function RatingDistributionChart({ data }: { data: RatingBucket[] }) {
  return (
    <ChartCard title="Rating distribution" subtitle="Reviews by star rating">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="rating" tickFormatter={(v) => `${v}★`} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} {...AXIS_PROPS} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            cursor={{ fill: "var(--surface-muted)" }}
            formatter={(value) => [value, "Reviews"] as [number, string]}
            labelFormatter={(v) => `${v} star`}
          />
          <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ThemeShareChart({ data }: { data: ThemeShare[] }) {
  const chartData = [...data].reverse(); // Recharts vertical bars render bottom-up
  return (
    <ChartCard
      title="Theme share"
      subtitle="Share of reviews mentioning each theme"
      height={Math.max(220, chartData.length * 34)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" unit="%" {...AXIS_PROPS} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            {...AXIS_PROPS}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
          />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            cursor={{ fill: "var(--surface-muted)" }}
            formatter={(value, _name, item) =>
              [`${value}% (${item.payload.count} reviews)`, "Share"] as [string, string]
            }
          />
          <Bar dataKey="pct" fill="var(--brand)" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WeeklyAvgRatingChart({ data }: { data: WeekBucket[] }) {
  return (
    <ChartCard title="Average rating by week" subtitle="Mean star rating per week">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="week" {...AXIS_PROPS} />
          <YAxis domain={[1, 5]} {...AXIS_PROPS} />
          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [value, "Avg rating"] as [number, string]} />
          <Line
            type="monotone"
            dataKey="avgRating"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--brand)", stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WeeklyOneStarShareChart({ data }: { data: WeekBucket[] }) {
  const chartData = data.map((d) => ({ ...d, oneStarPct: Math.round(d.oneStarShare * 1000) / 10 }));
  return (
    <ChartCard title="1-star share by week" subtitle="Share of weekly reviews that are 1-star">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="week" {...AXIS_PROPS} />
          <YAxis unit="%" {...AXIS_PROPS} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value}%`, "1-star share"] as [string, string]}
          />
          <Line
            type="monotone"
            dataKey="oneStarPct"
            stroke="var(--danger)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--danger)", stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OneStarDriversChart({ data }: { data: OneStarDriver[] }) {
  const chartData = [...data].reverse();
  if (chartData.length === 0) {
    return (
      <ChartCard title="What drives 1-star reviews" subtitle="Themes ranked by 1-star mentions" height={120}>
        <p className="text-sm text-foreground-muted">No 1-star reviews in this dataset.</p>
      </ChartCard>
    );
  }
  return (
    <ChartCard
      title="What drives 1-star reviews"
      subtitle="Themes ranked by count of 1-star mentions"
      height={Math.max(220, chartData.length * 34)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            {...AXIS_PROPS}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
          />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            cursor={{ fill: "var(--surface-muted)" }}
            formatter={(value) => [value, "1-star mentions"] as [number, string]}
          />
          <Bar dataKey="oneStarCount" fill="var(--danger)" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
