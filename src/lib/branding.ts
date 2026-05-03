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
  // Monochrome-only palette set (white/black/grays).
  {
    id: "deep-blue",
    name: "Mono Claro",
    description: "Blanco y negro con grises suaves.",
    colors: {
      primary: "#0a0a0a",
      primaryForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#0a0a0a",
      card: "#ffffff",
      muted: "#f4f4f5",
      border: "#e4e4e7",
      ring: "#a1a1aa",
    },
  },
  {
    id: "sunset",
    name: "Mono Suave",
    description: "Escala de grises con contraste moderado.",
    colors: {
      primary: "#111111",
      primaryForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#111111",
      card: "#ffffff",
      muted: "#f5f5f5",
      border: "#e5e5e5",
      ring: "#a3a3a3",
    },
  },
  {
    id: "forest",
    name: "Mono Contraste",
    description: "Look sobrio en blanco, negro y grises.",
    colors: {
      primary: "#000000",
      primaryForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#0f0f0f",
      card: "#ffffff",
      muted: "#f1f1f3",
      border: "#d4d4d8",
      ring: "#a1a1aa",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Neutro y minimalista en blanco y negro.",
    colors: {
      primary: "#0a0a0a",
      primaryForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#0a0a0a",
      card: "#ffffff",
      muted: "#f4f4f5",
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
