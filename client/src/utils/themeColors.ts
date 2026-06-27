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
  root.style.setProperty("--toast-info-border", lighten(primaryColor, 0.45));
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
    const classicHeader = mix(darken(primaryColor, 0.5), "#1e293b", 0.45);
    const classicTableHeader = mix(primaryColor, "#2c3e50", 0.55);
    root.style.setProperty("--classic-header-bg", classicHeader);
    root.style.setProperty("--classic-table-header", classicTableHeader);
    root.style.setProperty("--sidebar", classicHeader);
    root.style.setProperty("--sidebar-accent", mix(primaryColor, "#ffffff", 0.22));
    root.style.setProperty("--sidebar-border", darken(classicHeader, 0.12));
  } else {
    for (const prop of classicOnlyVars) {
      root.style.removeProperty(prop);
    }
  }
}
