import * as React from "react";

import { type WatermarkFontId, type WatermarkStyle } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  style: WatermarkStyle;
  color?: string;
  font?: WatermarkFontId;
  density?: "card" | "preview";
  /** Configured opacity (0.02..0.45). */
  opacity?: number;
  /** Tile density multiplier (0.4 sparse .. 2.2 dense). */
  tileDensity?: number;
};

const FONT_FAMILIES: Record<WatermarkFontId, string> = {
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: '"Lora", Georgia, "Times New Roman", serif',
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  display: '"Space Grotesk", "Poppins", system-ui, sans-serif',
};

export function WatermarkOverlay({
  label,
  style,
  color = "#ffffff",
  font = "sans",
  density = "card",
  opacity = 0.08,
  tileDensity = 1,
}: Props) {
  if (style === "none") return null;

  const fontFamily = FONT_FAMILIES[font];
  const isPreview = density === "preview";
  const resolvedOpacity = clampOpacity(opacity);
  const tile = clampDensity(tileDensity);

  if (style === "subtle") {
    const baseSpacing = isPreview ? 250 : 190;
    return (
      <>
        <DiagonalPattern
          label={label}
          color={color}
          fontFamily={fontFamily}
          opacity={(isPreview ? 0.14 : 0.12) * resolvedOpacityFactor(resolvedOpacity)}
          fontSize={isPreview ? 30 : 20}
          spacing={Math.max(60, baseSpacing / tile)}
        />
        <SignatureCorner
          label={label}
          color={color}
          fontFamily={fontFamily}
          large={isPreview}
          opacity={resolvedOpacity}
        />
      </>
    );
  }

  const baseSpacing = isPreview ? 180 : 140;
  return (
    <>
      <DiagonalPattern
        label={label}
        color={color}
        fontFamily={fontFamily}
        opacity={(isPreview ? 0.18 : 0.14) * resolvedOpacityFactor(resolvedOpacity)}
        fontSize={isPreview ? 28 : 18}
        spacing={Math.max(50, baseSpacing / tile)}
      />
      <CenterStamp
        label={label}
        color={color}
        fontFamily={fontFamily}
        large={isPreview}
        opacity={resolvedOpacity}
      />
      <SignatureCorner
        label={label}
        color={color}
        fontFamily={fontFamily}
        large={isPreview}
        opacity={resolvedOpacity}
      />
    </>
  );
}

function DiagonalPattern({
  label,
  color,
  fontFamily,
  opacity,
  fontSize,
  spacing,
}: {
  label: string;
  color: string;
  fontFamily: string;
  opacity: number;
  fontSize: number;
  spacing: number;
}) {
  const safe = label.replace(/[<>&"']/g, "");
  const tileWidth = Math.max(spacing, safe.length * fontSize * 0.65);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${spacing}" viewBox="0 0 ${tileWidth} ${spacing}">\n  <g transform="rotate(-30 ${tileWidth / 2} ${spacing / 2})">\n    <text x="${tileWidth / 2}" y="${spacing / 2}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-family='${fontFamily}' font-size="${fontSize}" font-weight="800" letter-spacing="${Math.max(2, fontSize * 0.2)}" style="text-transform: uppercase;">${safe}</text>\n  </g>\n</svg>`;
  const dataUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: dataUri,
        backgroundSize: `${tileWidth}px ${spacing}px`,
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}

function SignatureCorner({
  label,
  color,
  fontFamily,
  large,
  opacity,
}: {
  label: string;
  color: string;
  fontFamily: string;
  large: boolean;
  opacity: number;
}) {
  const displayLabel = toAccountHandle(label);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-3 bottom-3",
        large ? "right-5 bottom-5" : ""
      )}
    >
      <span
        className={cn("tracking-[0.04em]", large ? "text-lg" : "text-base")}
        style={{
          color,
          fontFamily,
          fontWeight: 800,
          opacity: Math.max(0.12, Math.min(0.9, opacity + 0.32)),
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        {displayLabel}
      </span>
    </div>
  );
}

function CenterStamp({
  label,
  color,
  fontFamily,
  large,
  opacity,
}: {
  label: string;
  color: string;
  fontFamily: string;
  large: boolean;
  opacity: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className="-rotate-12 rounded-sm border px-3 py-1 backdrop-blur-[1px]"
        style={{
          borderColor: `${color}55`,
          color,
          opacity: Math.max(0.12, Math.min(0.9, opacity + 0.2)),
          fontFamily,
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          fontSize: large ? 22 : 14,
          textShadow: "0 1px 3px rgba(0,0,0,0.55)",
          background: "rgba(0,0,0,0.18)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function toAccountHandle(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "@4tercios";
  if (trimmed.startsWith("@")) return trimmed;
  if (trimmed.includes(" ")) return trimmed;
  return `@${trimmed}`;
}

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) return 0.08;
  return Math.max(0.02, Math.min(0.45, value));
}

function clampDensity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.4, Math.min(2.2, value));
}

function resolvedOpacityFactor(opacity: number) {
  // Map configured opacity (0.02..0.45) to a subtle visual multiplier.
  return Math.max(0.18, Math.min(1, opacity / 0.16));
}
