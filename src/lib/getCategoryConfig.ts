// Single source of truth for category presentation (label, colors, icons).
// Never hardcode category colors/labels in components — always read from here.

import { GraduationCap, Trophy, Zap, type LucideIcon } from "lucide-react";

export type Category = "scholarship" | "competition" | "event";

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  /** Solid pill badge (used on PostCard image overlay, detail header, admin table) */
  badgeClass: string;
  /** Subtle pill badge using existing tinted styles (used on home filter, etc.) */
  pillClass: string;
  /** Calendar dot color (mobile dots) */
  dotClass: string;
  /** Calendar text-pill (desktop calendar cells) */
  calendarPillClass: string;
  /** Filter label */
  filterLabel: string;
  /** Empty state message */
  emptyMessage: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  scholarship: {
    label: "Beasiswa",
    icon: GraduationCap,
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
    pillClass: "bg-primary/10 text-primary",
    dotClass: "bg-blue-500",
    calendarPillClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    filterLabel: "Beasiswa",
    emptyMessage: "Belum ada beasiswa yang tersedia.",
  },
  competition: {
    label: "Lomba",
    icon: Trophy,
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    pillClass: "bg-emerald/10 text-emerald",
    dotClass: "bg-emerald-500",
    calendarPillClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    filterLabel: "Lomba",
    emptyMessage: "Belum ada lomba yang tersedia.",
  },
  event: {
    label: "Event",
    icon: Zap,
    badgeClass: "bg-violet-100 text-violet-800 border border-violet-200",
    pillClass: "bg-violet-100 text-violet-800",
    dotClass: "bg-violet-500",
    calendarPillClass:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    filterLabel: "Event",
    emptyMessage: "Belum ada event yang tersedia.",
  },
};

export const ALL_CATEGORIES: Category[] = ["scholarship", "competition", "event"];

export function getCategoryConfig(category: string): CategoryConfig {
  return (
    CATEGORY_CONFIG[category as Category] ?? {
      label: category,
      icon: GraduationCap,
      badgeClass: "bg-secondary text-secondary-foreground border border-border",
      pillClass: "bg-secondary text-muted-foreground",
      dotClass: "bg-muted-foreground",
      calendarPillClass: "bg-secondary text-foreground",
      filterLabel: category,
      emptyMessage: "Belum ada konten.",
    }
  );
}
