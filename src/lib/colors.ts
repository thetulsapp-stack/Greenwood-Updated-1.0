import type { CSSProperties } from "react";
import type { SiteTheme } from "./siteSettings";

export function cssThemeVars(theme: SiteTheme): CSSProperties {
  return {
    ["--bg" as string]: theme.background,
    ["--bg-soft" as string]: theme.backgroundSoft,
    ["--surface" as string]: theme.surface,
    ["--surface-alt" as string]: theme.surfaceAlt,
    ["--text" as string]: theme.text,
    ["--muted" as string]: theme.muted,
    ["--primary" as string]: theme.primary,
    ["--primary-2" as string]: theme.primaryHover,
    ["--accent" as string]: theme.accent,
    ["--border" as string]: theme.border,
    ["--success" as string]: theme.success,
    ["--shadow" as string]: "0 22px 60px rgba(29, 27, 24, 0.08)",
    ["--shadow-soft" as string]: "0 12px 30px rgba(15, 81, 50, 0.08)",
  } as CSSProperties;
}
