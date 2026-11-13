import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function ChartCard({
  title,
  subtitle,
  children,
  height = 260,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-foreground-muted">{subtitle}</p>}
      <div style={{ height }}>{children}</div>
    </Card>
  );
}

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--foreground-muted)" },
  cursor: { fill: "var(--surface-muted)" },
};
