import * as React from "react";

import { type WatermarkFontId, type WatermarkStyle } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  style: WatermarkStyle;
  color?: string;
  font?: WatermarkFontId;
  density?: "card" | "preview";
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
}: Props) {
  if (style === "none") return null;

  const fontFamily = FONT_FAMILIES[font];
  const isPreview = density === "preview";

  if (style === "subtle") {
    return (
      <>
        <DiagonalPattern
          label={label}
          color={color}
          fontFamily={fontFamily}
          opacity={isPreview ? 0.18 : 0.14}
          fontSize={isPreview ? 22 : 14}
          spacing={isPreview ? 240 : 180}
        />
        <SignatureCorner label={label} color={color} fontFamily={fontFamily} large={isPreview} />
      </>
    );
  }

  return (
    <>
      <DiagonalPattern
        label={label}
        color={color}
        fontFamily={fontFamily}
        opacity={isPreview ? 0.28 : 0.22}
        fontSize={isPreview ? 28 : 18}
        spacing={isPreview ? 180 : 140}
      />
      <CenterStamp label={label} color={color} fontFamily={fontFamily} large={isPreview} />
      <SignatureCorner label={label} color={color} fontFamily={fontFamily} large={isPreview} />
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
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${spacing}" viewBox="0 0 ${tileWidth} ${spacing}">\n  <g transform="rotate(-30 ${tileWidth / 2} ${spacing / 2})">\n    <text x="${tileWidth / 2}" y="${spacing / 2}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-family='${fontFamily}' font-size="${fontSize}" font-weight="600" letter-spacing="${Math.max(2, fontSize * 0.18)}" style="text-transform: uppercase;">${safe}</text>\n  </g>\n</svg>`;
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
}: {
  label: string;
  color: string;
  fontFamily: string;
  large: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-3 bottom-3 flex items-center gap-2",
        large ? "right-5 bottom-5" : ""
      )}
    >
      <span
        className={cn("h-px", large ? "w-10" : "w-6")}
        style={{ backgroundColor: color, opacity: 0.65 }}
      />
      <span
        className={cn("tracking-[0.18em] uppercase", large ? "text-[12px]" : "text-[9px]")}
        style={{
          color,
          fontFamily,
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.45)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CenterStamp({
  label,
  color,
  fontFamily,
  large,
}: {
  label: string;
  color: string;
  fontFamily: string;
  large: boolean;
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
