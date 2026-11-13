import { clsx } from "clsx";
import type { HTMLAttributes } from "react";
import type { ThemeType } from "@/lib/types";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

const THEME_TYPE_STYLES: Record<ThemeType, string> = {
  bug: "bg-red-500/10 text-red-600 dark:text-red-300",
  feature_request: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  ux: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  pricing: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
  delivery: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  support: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
  quality: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  praise: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  other: "bg-gray-500/10 text-gray-600 dark:text-gray-300",
};

export const THEME_TYPE_LABELS: Record<ThemeType, string> = {
  bug: "Bug",
  feature_request: "Feature request",
  ux: "UX",
  pricing: "Pricing",
  delivery: "Delivery",
  support: "Support",
  quality: "Quality",
  praise: "Praise",
  other: "Other",
};

export function ThemeTypeBadge({ type }: { type: ThemeType }) {
  return <Badge className={THEME_TYPE_STYLES[type]}>{THEME_TYPE_LABELS[type]}</Badge>;
}
