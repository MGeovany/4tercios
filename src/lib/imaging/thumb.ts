import "server-only";

import sharp from "sharp";
import {
  normalizeHexColor,
  type WatermarkFontId,
  type WatermarkStyle,
} from "@/lib/branding";

const THUMB_WIDTH = 1280;

/**
 * Build a watermarked WebP thumbnail from the original photo bytes.
 * Returns the WebP buffer plus original dimensions so we can persist them.
 */
export async function buildWatermarkedThumb(
  originalBytes: Uint8Array | Buffer,
  watermark: {
    label: string;
    style: WatermarkStyle;
    color: string;
    font: WatermarkFontId;
    opacity?: number;
    density?: number;
  }
): Promise<{
  webp: Buffer;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
}> {
  const image = sharp(originalBytes, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const origW = meta.width ?? 0;
  const origH = meta.height ?? 0;

  const target =
    origW > THUMB_WIDTH ? { width: THUMB_WIDTH } : { width: origW || THUMB_WIDTH };
  const resized = await image
    .resize(target)
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });

  if (watermark.style === "none") {
    return {
      webp: resized.data,
      width: origW,
      height: origH,
      thumbWidth: resized.info.width,
      thumbHeight: resized.info.height,
    };
  }

  const overlaySvg = svgWatermark(resized.info.width, resized.info.height, watermark);
  const composed = await sharp(resized.data)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .webp({ quality: 80 })
    .toBuffer();

  return {
    webp: composed,
    width: origW,
    height: origH,
    thumbWidth: resized.info.width,
    thumbHeight: resized.info.height,
  };
}

function svgWatermark(
  width: number,
  height: number,
  watermark: {
    label: string;
    style: WatermarkStyle;
    color: string;
    font: WatermarkFontId;
    opacity?: number;
    density?: number;
  }
) {
  const safeLabel = escapeXml(toAccountHandle(watermark.label || "4Tercios"));
  const color = normalizeHexColor(watermark.color, "#ffffff");
  const fontFamily = svgFontFamily(watermark.font);
  const isBold = watermark.style === "bold";
  const opacity = clampOpacity(watermark.opacity ?? 0.08);
  const density = clampDensity(watermark.density ?? 1);

  const min = Math.min(width, height);

  // Diagonal repeating pattern (like real photo watermarks)
  const tileFontSize = Math.max(16, Math.round(min * (isBold ? 0.038 : 0.03)));
  const tileLetterSpacing = Math.max(2, tileFontSize * 0.2);
  const tileLabelWidth =
    safeLabel.length * tileFontSize * 0.6 + tileLetterSpacing * safeLabel.length;
  const baseTileWidth = Math.max(220, Math.round(tileLabelWidth * 1.6));
  const tileWidth = Math.max(
    Math.round(tileLabelWidth * 1.05),
    Math.round(baseTileWidth / density)
  );
  const tileHeight = isBold ? Math.round(tileWidth * 0.7) : Math.round(tileWidth * 0.85);
  const patternOpacity = (isBold ? 0.14 : 0.1) * opacityFactor(opacity);

  // Center diagonal stamp (only for bold)
  const stampFontSize = Math.max(26, Math.round(min * 0.062));
  const stampLetterSpacing = Math.max(4, stampFontSize * 0.3);
  const stampLabelWidth =
    safeLabel.length * stampFontSize * 0.62 + stampLetterSpacing * safeLabel.length;

  // Signature in corner
  const sigFontSize = Math.max(16, Math.round(min * (isBold ? 0.028 : 0.024)));
  const sigLetterSpacing = Math.max(2.5, sigFontSize * 0.22);
  const sigLabelWidth =
    safeLabel.length * sigFontSize * 0.6 + sigLetterSpacing * safeLabel.length;
  const sigBlockWidth = sigLabelWidth;
  const sigPadding = Math.round(min * 0.025);
  const sigX = width - sigBlockWidth - sigPadding;
  const sigY = height - sigPadding - sigFontSize / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="wm-tile" patternUnits="userSpaceOnUse" width="${tileWidth}" height="${tileHeight}" patternTransform="rotate(-30)">
      <text
        x="${tileWidth / 2}"
        y="${tileHeight / 2}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${color}"
        fill-opacity="${patternOpacity}"
        font-family="${fontFamily}"
        font-size="${tileFontSize}"
        font-weight="800"
        letter-spacing="${tileLetterSpacing}"
        style="text-transform: uppercase;"
      >${safeLabel}</text>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#wm-tile)" />
  ${
    isBold
      ? `
  <g transform="translate(${(width - stampLabelWidth) / 2}, ${height / 2}) rotate(-12 ${stampLabelWidth / 2} 0)">
    <text
      x="0"
      y="0"
      dominant-baseline="middle"
      fill="${color}"
      fill-opacity="${Math.max(0.12, Math.min(0.9, opacity + 0.2))}"
      font-family="${fontFamily}"
      font-size="${stampFontSize}"
      font-weight="800"
      letter-spacing="${stampLetterSpacing}"
      style="text-transform: uppercase; paint-order: stroke; stroke: rgba(0,0,0,0.32); stroke-width: 2;"
    >${safeLabel}</text>
  </g>`
      : ""
  }
  <g transform="translate(${sigX}, ${sigY})">
    <text
      x="0"
      y="0"
      dominant-baseline="middle"
      fill="${color}"
      fill-opacity="${Math.max(0.12, Math.min(0.9, opacity + 0.28))}"
      font-family="${fontFamily}"
      font-size="${sigFontSize}"
      font-weight="800"
      letter-spacing="${sigLetterSpacing}"
      style="text-transform: uppercase; paint-order: stroke; stroke: rgba(0,0,0,0.32); stroke-width: 1.4;"
    >${safeLabel}</text>
  </g>
</svg>`;
}

function svgFontFamily(font: WatermarkFontId) {
  switch (font) {
    case "serif":
      return "Georgia, &apos;Times New Roman&apos;, serif";
    case "mono":
      return "ui-monospace, SFMono-Regular, Menlo, monospace";
    case "display":
      return "Poppins, Inter, Arial, sans-serif";
    default:
      return "-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Inter, Helvetica, Arial, sans-serif";
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

function opacityFactor(opacity: number) {
  return Math.max(0.18, Math.min(1, opacity / 0.16));
}

function clampDensity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.4, Math.min(2.2, value));
}
