export type BrandPaletteId = "deep-blue" | "sunset" | "forest" | "mono";
export type BrandFontId = "inter" | "poppins" | "lora" | "space-grotesk";
export type WatermarkStyle = "none" | "subtle" | "bold";
export type WatermarkFontId = "sans" | "serif" | "mono" | "display";

export const BRAND_PALETTES: {
  id: BrandPaletteId;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    card: string;
    muted: string;
    border: string;
    ring: string;
  };
}[] = [
  {
    id: "deep-blue",
    name: "Deep Blue",
    description: "Limpia y elegante con acentos azules.",
    colors: {
      primary: "#134074",
      primaryForeground: "#eef4ed",
      background: "#eef4ed",
      foreground: "#0b2545",
      card: "#f9fbfa",
      muted: "#dce6ee",
      border: "#c5d4e0",
      ring: "#8da9c4",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Tonos cálidos para eventos sociales.",
    colors: {
      primary: "#c45b2d",
      primaryForeground: "#fff8f3",
      background: "#fff7f2",
      foreground: "#3b1f12",
      card: "#ffffff",
      muted: "#f5e2d8",
      border: "#e7c5b2",
      ring: "#d58c67",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Verdes profundos para un look premium.",
    colors: {
      primary: "#1f6b52",
      primaryForeground: "#eefaf5",
      background: "#eef7f2",
      foreground: "#103027",
      card: "#f8fcfa",
      muted: "#d8ebe3",
      border: "#b8d8ca",
      ring: "#6da990",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Neutro y minimalista.",
    colors: {
      primary: "#18181b",
      primaryForeground: "#f4f4f5",
      background: "#fafafa",
      foreground: "#18181b",
      card: "#ffffff",
      muted: "#f1f1f3",
      border: "#e4e4e7",
      ring: "#a1a1aa",
    },
  },
];

export const BRAND_FONTS: { id: BrandFontId; name: string }[] = [
  { id: "inter", name: "Inter" },
  { id: "poppins", name: "Poppins" },
  { id: "lora", name: "Lora" },
  { id: "space-grotesk", name: "Space Grotesk" },
];

export const WATERMARK_STYLES: { id: WatermarkStyle; name: string; description: string }[] = [
  { id: "none", name: "Sin marca", description: "No agrega texto sobre la miniatura." },
  {
    id: "subtle",
    name: "Sutil",
    description: "Marca pequeña en la esquina inferior derecha.",
  },
  {
    id: "bold",
    name: "Fuerte",
    description: "Marca amplia y centrada con más presencia.",
  },
];

export const WATERMARK_FONTS: { id: WatermarkFontId; name: string }[] = [
  { id: "sans", name: "Sans" },
  { id: "serif", name: "Serif" },
  { id: "mono", name: "Mono" },
  { id: "display", name: "Display" },
];

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  return /^#([A-Fa-f0-9]{6})$/.test(trimmed) ? trimmed : fallback;
}

export function resolvePalette(paletteId: string | null | undefined) {
  return BRAND_PALETTES.find((palette) => palette.id === paletteId) ?? BRAND_PALETTES[0];
}

export function buildThemeCssVars(input: {
  paletteId?: string | null;
  primaryColor?: string | null;
}) {
  const palette = resolvePalette(input.paletteId);
  const primary = normalizeHexColor(input.primaryColor, palette.colors.primary);

  return {
    "--background": palette.colors.background,
    "--foreground": palette.colors.foreground,
    "--card": palette.colors.card,
    "--card-foreground": palette.colors.foreground,
    "--popover": palette.colors.card,
    "--popover-foreground": palette.colors.foreground,
    "--primary": primary,
    "--primary-foreground": palette.colors.primaryForeground,
    "--secondary": palette.colors.muted,
    "--secondary-foreground": palette.colors.foreground,
    "--muted": palette.colors.muted,
    "--muted-foreground": palette.colors.foreground,
    "--accent": palette.colors.muted,
    "--accent-foreground": palette.colors.foreground,
    "--border": palette.colors.border,
    "--input": palette.colors.border,
    "--ring": palette.colors.ring,
    "--sidebar": palette.colors.card,
    "--sidebar-foreground": palette.colors.foreground,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": palette.colors.primaryForeground,
    "--sidebar-accent": palette.colors.muted,
    "--sidebar-accent-foreground": palette.colors.foreground,
    "--sidebar-border": palette.colors.border,
    "--sidebar-ring": palette.colors.ring,
  } as Record<string, string>;
}
