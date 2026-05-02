import "server-only";

import sharp from "sharp";
import { normalizeHexColor, type WatermarkFontId, type WatermarkStyle } from "@/lib/branding";

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

  const target = origW > THUMB_WIDTH ? { width: THUMB_WIDTH } : { width: origW || THUMB_WIDTH };
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
  watermark: { label: string; style: WatermarkStyle; color: string; font: WatermarkFontId }
) {
  const safeLabel = escapeXml(watermark.label || "4Tercios");
  const color = normalizeHexColor(watermark.color, "#ffffff");
  const fontFamily = svgFontFamily(watermark.font);
  const isBold = watermark.style === "bold";

  const min = Math.min(width, height);

  // Diagonal repeating pattern (like real photo watermarks)
  const tileFontSize = Math.max(11, Math.round(min * (isBold ? 0.028 : 0.02)));
  const tileLetterSpacing = Math.max(1.5, tileFontSize * 0.16);
  const tileLabelWidth =
    safeLabel.length * tileFontSize * 0.6 + tileLetterSpacing * safeLabel.length;
  const tileWidth = Math.max(220, Math.round(tileLabelWidth * 1.6));
  const tileHeight = isBold ? Math.round(tileWidth * 0.7) : Math.round(tileWidth * 0.85);
  const patternOpacity = isBold ? 0.18 : 0.12;

  // Center diagonal stamp (only for bold)
  const stampFontSize = Math.max(20, Math.round(min * 0.05));
  const stampLetterSpacing = Math.max(3, stampFontSize * 0.28);
  const stampLabelWidth =
    safeLabel.length * stampFontSize * 0.62 + stampLetterSpacing * safeLabel.length;

  // Signature in corner
  const sigFontSize = Math.max(13, Math.round(min * (isBold ? 0.022 : 0.018)));
  const sigLetterSpacing = Math.max(2, sigFontSize * 0.2);
  const sigLabelWidth = safeLabel.length * sigFontSize * 0.6 + sigLetterSpacing * safeLabel.length;
  const sigLineWidth = Math.round(sigFontSize * 1.6);
  const sigBlockWidth = sigLineWidth + 8 + sigLabelWidth;
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
        font-weight="600"
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
      fill-opacity="0.75"
      font-family="${fontFamily}"
      font-size="${stampFontSize}"
      font-weight="700"
      letter-spacing="${stampLetterSpacing}"
      style="text-transform: uppercase; paint-order: stroke; stroke: rgba(0,0,0,0.35); stroke-width: 2;"
    >${safeLabel}</text>
  </g>`
      : ""
  }
  <g transform="translate(${sigX}, ${sigY})">
    <rect x="0" y="-1" width="${sigLineWidth}" height="2" fill="${color}" fill-opacity="0.85" rx="1" />
    <text
      x="${sigLineWidth + 8}"
      y="0"
      dominant-baseline="middle"
      fill="${color}"
      font-family="${fontFamily}"
      font-size="${sigFontSize}"
      font-weight="600"
      letter-spacing="${sigLetterSpacing}"
      style="text-transform: uppercase; paint-order: stroke; stroke: rgba(0,0,0,0.45); stroke-width: 1.5;"
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
