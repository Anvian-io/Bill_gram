type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "").trim();
  const h =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + (255 - r) * amount,
    g: g + (255 - g) * amount,
    b: b + (255 - b) * amount,
  });
}

export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r * (1 - amount),
    g: g * (1 - amount),
    b: b * (1 - amount),
  });
}

export function mix(hex1: string, hex2: string, weight: number): string {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const w = Math.min(1, Math.max(0, weight));
  return rgbToHex({
    r: c1.r * w + c2.r * (1 - w),
    g: c1.g * w + c2.g * (1 - w),
    b: c1.b * w + c2.b * (1 - w),
  });
}

interface ApplyPrimaryThemeOptions {
  isDark: boolean;
  isClassic: boolean;
}

/** Apply primary color and all derived theme CSS variables to the document root. */
export function applyPrimaryTheme(
  root: HTMLElement,
  primaryColor: string,
  { isDark, isClassic }: ApplyPrimaryThemeOptions,
): void {
  root.style.setProperty("--primary", primaryColor);
  root.style.setProperty("--ring", primaryColor);
  root.style.setProperty("--sidebar-primary", primaryColor);
  root.style.setProperty("--sidebar-ring", primaryColor);

  const accent = isDark ? lighten(primaryColor, 0.15) : lighten(primaryColor, 0.2);
  root.style.setProperty("--accent", accent);

  const sidebarAccent = isDark
    ? mix(primaryColor, "#374151", 0.22)
    : lighten(primaryColor, 0.08);
  root.style.setProperty("--sidebar-accent", sidebarAccent);

  root.style.setProperty("--chart-1", primaryColor);
  root.style.setProperty("--chart-2", accent);
  root.style.setProperty("--chart-3", lighten(primaryColor, 0.35));
  root.style.setProperty("--chart-4", lighten(primaryColor, 0.5));
  root.style.setProperty("--chart-5", lighten(primaryColor, 0.65));

  root.style.setProperty("--toast-info-icon", primaryColor);
  root.style.setProperty(
    "--toast-default-bg",
    isDark ? mix(primaryColor, "#4b5563", 0.55) : lighten(primaryColor, 0.35),
  );

  const classicOnlyVars = [
    "--classic-header-bg",
    "--classic-table-header",
    "--sidebar",
    "--sidebar-border",
  ];

  if (isClassic) {
    const classicTableHeader = mix(primaryColor, "#2c3e50", 0.55);
    root.style.setProperty("--classic-header-bg", classicTableHeader);
    root.style.setProperty("--classic-table-header", classicTableHeader);
    root.style.setProperty("--sidebar", classicTableHeader);
    root.style.setProperty("--sidebar-accent", mix(primaryColor, "#ffffff", 0.22));
    root.style.setProperty("--sidebar-border", darken(classicTableHeader, 0.12));
    root.style.setProperty("--shell-surface-bg", classicTableHeader);
  } else {
    for (const prop of classicOnlyVars) {
      root.style.removeProperty(prop);
    }
  }

  root.style.setProperty(
    "--toast-info-bg",
    isDark ? mix(primaryColor, "#1e293b", 0.4) : lighten(primaryColor, 0.58),
  );
  root.style.setProperty(
    "--toast-info-text",
    isDark ? lighten(primaryColor, 0.35) : darken(primaryColor, 0.25),
  );
  root.style.setProperty(
    "--toast-info-border",
    isDark ? mix(primaryColor, "#1e3a8a", 0.5) : lighten(primaryColor, 0.35),
  );

  applyShellTheme(root, primaryColor, accent, { isDark, isClassic });
  applyTableTheme(root, primaryColor, { isDark });
  applyButtonTheme(root, primaryColor, accent, { isDark });
}

function getContrastForeground(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111827" : "#ffffff";
}

function applyButtonTheme(
  root: HTMLElement,
  primaryColor: string,
  _accent: string,
  { isDark }: Pick<ApplyPrimaryThemeOptions, "isDark">,
): void {
  const surface = isDark ? "#111827" : "#ffffff";
  const lightHoverFg = lighten(primaryColor, isDark ? 0.32 : 0.42);

  root.style.setProperty("--primary-foreground", getContrastForeground(primaryColor));
  root.style.setProperty("--accent-foreground", getContrastForeground(_accent));
  root.style.setProperty("--button-hover-fg", "#ffffff");

  root.style.setProperty("--button-default-hover-bg", darken(primaryColor, 0.07));
  root.style.setProperty("--button-default-hover-fg", "#ffffff");

  root.style.setProperty(
    "--button-outline-hover-bg",
    isDark ? mix(primaryColor, "#000000", 0.3) : primaryColor,
  );
  root.style.setProperty("--button-outline-hover-fg", "#ffffff");
  root.style.setProperty(
    "--button-outline-hover-border",
    isDark ? lighten(primaryColor, 0.14) : lighten(primaryColor, 0.22),
  );

  root.style.setProperty(
    "--button-ghost-hover-bg",
    isDark ? mix(primaryColor, "#000000", 0.4) : mix(primaryColor, surface, 0.52),
  );
  root.style.setProperty("--button-ghost-hover-fg", "#ffffff");

  root.style.setProperty(
    "--button-secondary-hover-bg",
    isDark ? mix(primaryColor, "#374151", 0.5) : mix(primaryColor, "#f3f4f6", 0.42),
  );
  root.style.setProperty("--button-secondary-hover-fg", "#ffffff");

  root.style.setProperty("--button-link-hover-fg", lightHoverFg);
}

function applyTableTheme(
  root: HTMLElement,
  primaryColor: string,
  { isDark }: Pick<ApplyPrimaryThemeOptions, "isDark">,
): void {
  const borderBase = isDark ? "#374151" : "#e5e7eb";

  root.style.setProperty(
    "--table-outline-color",
    mix(borderBase, primaryColor, isDark ? 0.9 : 0.92),
  );
  root.style.setProperty(
    "--table-row-border-color",
    mix(borderBase, primaryColor, isDark ? 0.92 : 0.94),
  );
  root.style.setProperty(
    "--filter-border-color",
    mix(borderBase, primaryColor, isDark ? 0.86 : 0.88),
  );
}

function applyShellTheme(
  root: HTMLElement,
  primaryColor: string,
  accent: string,
  { isDark, isClassic }: ApplyPrimaryThemeOptions,
): void {
  const borderBase = isDark ? "#374151" : "#e5e7eb";
  root.style.setProperty("--border", mix(primaryColor, borderBase, 0.86));
  root.style.setProperty(
    "--input",
    isDark ? mix(primaryColor, "#1f2937", 0.88) : mix(primaryColor, borderBase, 0.92),
  );

  if (isClassic) {
    const classicTableHeader = mix(primaryColor, "#2c3e50", 0.55);
    const shellBorder = darken(classicTableHeader, 0.12);

    root.style.setProperty("--shell-surface-bg", classicTableHeader);
    root.style.setProperty("--shell-surface-border", shellBorder);
    root.style.setProperty("--shell-surface-hover-bg", mix(primaryColor, "#ffffff", 0.18));
    root.style.setProperty("--shell-surface-hover-fg", "#ffffff");
    root.style.setProperty("--shell-surface-hover-border", mix(primaryColor, "#ffffff", 0.38));
    root.style.setProperty("--shell-surface-active-bg", mix(primaryColor, "#ffffff", 0.28));
    root.style.setProperty("--shell-surface-active-fg", "#ffffff");
    root.style.setProperty("--shell-surface-active-border", lighten(primaryColor, 0.12));
    root.style.setProperty(
      "--shell-surface-highlight-bg",
      mix("#ffffff", classicTableHeader, 0.14),
    );
    root.style.setProperty("--shell-surface-ring", lighten(primaryColor, 0.22));
    return;
  }

  const shellBorder = isDark ? mix(primaryColor, accent, 0.42) : darken(accent, 0.1);

  root.style.setProperty("--shell-surface-bg", accent);
  root.style.setProperty("--shell-surface-border", shellBorder);
  root.style.setProperty(
    "--shell-surface-hover-bg",
    isDark ? mix(primaryColor, accent, 0.32) : mix(primaryColor, accent, 0.58),
  );
  root.style.setProperty("--shell-surface-hover-fg", "#ffffff");
  root.style.setProperty(
    "--shell-surface-hover-border",
    mix(primaryColor, shellBorder, 0.55),
  );
  root.style.setProperty(
    "--shell-surface-active-bg",
    isDark ? mix(primaryColor, "#000000", 0.38) : primaryColor,
  );
  root.style.setProperty("--shell-surface-active-fg", "#ffffff");
  root.style.setProperty(
    "--shell-surface-active-border",
    isDark ? lighten(primaryColor, 0.15) : mix("#ffffff", primaryColor, 0.35),
  );
  root.style.setProperty(
    "--shell-surface-highlight-bg",
    mix(primaryColor, accent, isDark ? 0.18 : 0.14),
  );
  root.style.setProperty("--shell-surface-ring", primaryColor);
}
