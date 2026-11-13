"use client";

import { useMemo, useState } from "react";
import { ThemeTypeBadge } from "@/components/ui/Badge";
import type { Theme } from "@/lib/types";

type SortKey = "score" | "reach" | "impact" | "confidence" | "effort" | "name";

const IMPACT_OPTIONS = [1, 2, 3] as const;
const EFFORT_OPTIONS = [1, 2, 3, 4, 5] as const;

function sortThemes(themes: Theme[], key: SortKey, dir: 1 | -1): Theme[] {
  const praise = themes.filter((t) => t.type === "praise").sort((a, b) => b.score - a.score);
  const rest = themes.filter((t) => t.type !== "praise");

  rest.sort((a, b) => {
    if (key === "name") return dir * a.name.localeCompare(b.name);
    return dir * (a[key] - b[key]);
  });

  return [...rest, ...praise];
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: 1 | -1;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === activeKey;
  return (
    <th className={`px-3 py-2 text-xs font-medium text-foreground-muted ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {active && <span aria-hidden>{dir === 1 ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

export function RiceTable({
  themes,
  onEditRice,
  onSelectTheme,
  selectedThemeId,
}: {
  themes: Theme[];
  onEditRice: (themeId: string, field: "impact" | "effort", value: number) => void;
  onSelectTheme: (themeId: string) => void;
  selectedThemeId?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [dir, setDir] = useState<1 | -1>(-1);

  const sorted = useMemo(() => sortThemes(themes, sortKey, dir), [themes, sortKey, dir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setDir(-1);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-foreground-muted">
              <button type="button" onClick={() => handleSort("name")} className="hover:text-foreground">
                Theme {sortKey === "name" && <span aria-hidden>{dir === 1 ? "↑" : "↓"}</span>}
              </button>
            </th>
            <SortHeader label="Reach" sortKey="reach" activeKey={sortKey} dir={dir} onSort={handleSort} />
            <SortHeader label="Impact" sortKey="impact" activeKey={sortKey} dir={dir} onSort={handleSort} />
            <SortHeader label="Confidence" sortKey="confidence" activeKey={sortKey} dir={dir} onSort={handleSort} />
            <SortHeader label="Effort" sortKey="effort" activeKey={sortKey} dir={dir} onSort={handleSort} />
            <SortHeader label="Score" sortKey="score" activeKey={sortKey} dir={dir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((theme) => (
            <tr
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={`cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted ${
                selectedThemeId === theme.id ? "bg-surface-muted" : ""
              }`}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{theme.name}</span>
                  <ThemeTypeBadge type={theme.type} />
                </div>
                <p className="mt-0.5 text-xs text-foreground-muted">{theme.review_ids.length} mentions</p>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{theme.reach}</td>
              <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                <select
                  value={theme.impact}
                  title={theme.rationale.impact}
                  onChange={(e) => onEditRice(theme.id, "impact", Number(e.target.value))}
                  className="rounded border border-border bg-surface px-1.5 py-1 text-right tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {IMPACT_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{theme.confidence}%</td>
              <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                <select
                  value={theme.effort}
                  title={theme.rationale.effort}
                  onChange={(e) => onEditRice(theme.id, "effort", Number(e.target.value))}
                  className="rounded border border-border bg-surface px-1.5 py-1 text-right tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {EFFORT_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{theme.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
